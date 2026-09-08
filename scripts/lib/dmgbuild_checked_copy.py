"""Instrument only pinned dmgbuild's app copy; never edit its installed package."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import plistlib
import math

CORE_SHA256 = "27137ae996ad1984e98fba3adfba92730888d1e75c3e3baa9a5be937dabf9844"


def file_digest(file):
    with file.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def identity(app, run):
    with (app / "Contents/Info.plist").open("rb") as stream:
        executable = plistlib.load(stream)["CFBundleExecutable"]
    result = {"app": str(app), "files": {}}
    for relative in [f"Contents/MacOS/{executable}", "Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"]:
        file = app / relative
        result["files"][relative] = {
            "exists": file.is_file(),
            "symlink": file.is_symlink(),
            "sha256": file_digest(file) if file.is_file() else None,
        }
    check = run(["/usr/bin/codesign", "--verify", "--deep", "--strict", "--verbose=4", str(app)], capture_output=True, text=True, timeout=120)
    result.update(valid=check.returncode == 0, signature_stdout=check.stdout, signature_stderr=check.stderr)
    return result


class CheckedCopy:
    def __init__(self, original, evidence):
        self.original = original
        self.evidence = Path(evidence)

    def __getattr__(self, name):
        return getattr(self.original, name)

    def call(self, args, *positional, **kwargs):
        if len(args) != 3 or args[0] != "/usr/bin/ditto" or not str(args[1]).endswith(".app"):
            return self.original.call(args, *positional, **kwargs)
        if positional or kwargs:
            raise RuntimeError("Pinned dmgbuild app-copy call shape changed")
        self.evidence.mkdir(parents=True, exist_ok=True)
        report = {"source": args[1], "destination": args[2], "core_sha256": CORE_SHA256}
        capacity_file = self.evidence / "capacity.json"
        if capacity_file.exists():
            capacity = json.loads(capacity_file.read_text())
            stats = os.statvfs(Path(args[2]).parent)
            report["available_before_copy"] = stats.f_bavail * stats.f_frsize
            report["planned_total_allocation"] = capacity["destination_allocation_bytes"]
            # Volume icon/background may already be copied. Charge only this
            # app against current free space, rather than counting them twice.
            report["required_allocation"] = destination_allocation([args[1]])["destination_allocation_bytes"]
        try:
            if report.get("available_before_copy", float("inf")) < report.get("required_allocation", 0) + COPY_HEADROOM:
                raise RuntimeError("Insufficient writable image capacity before copy")
            report["source_identity"] = identity(Path(args[1]), self.original.run)
            if not report["source_identity"]["valid"] or not all(f["exists"] for f in report["source_identity"]["files"].values()):
                raise RuntimeError("Staged app failed strict signature verification before ditto")
            copy = self.original.run(args, capture_output=True, text=True, timeout=600)
            report["ditto"] = {"exit": copy.returncode, "stdout": copy.stdout, "stderr": copy.stderr}
            print(copy.stdout, end="", flush=True)
            print(copy.stderr, end="", file=sys.stderr, flush=True)
            if copy.returncode:
                raise subprocess.CalledProcessError(copy.returncode, args, output=copy.stdout, stderr=copy.stderr)
            report["destination_identity"] = identity(Path(args[2]), self.original.run)
            source = report["source_identity"]
            destination = report["destination_identity"]
            report["matches"] = source["files"] == destination["files"]
            stats = os.statvfs(Path(args[2]).parent)
            report["available_after_copy"] = stats.f_bavail * stats.f_frsize
            if not destination["valid"] or not report["matches"]:
                raise RuntimeError("Copied app failed pre-conversion signature or executable identity checks")
            return 0
        except Exception as error:
            report["error"] = str(error)
            (self.evidence / "failure.json").write_text(json.dumps({
                "deterministic": not isinstance(error, subprocess.TimeoutExpired),
                "error": str(error),
                "stderr": getattr(error, "stderr", "") or "",
            }, default=str, indent=2) + "\n")
            if isinstance(error, subprocess.TimeoutExpired):
                report["timeout_seconds"] = error.timeout
                report["stderr"] = str(error.stderr or "")
            raise
        finally:
            (self.evidence / "preconversion-app-copy.json").write_text(json.dumps(report, indent=2) + "\n")


# hdiutil's default GPT layout reserves 200 MiB EFI + 128 MiB Apple_Free.
# Measured on the incident's empty HFS image: total minus filesystem =
# 343,973,888 bytes. Round that structural reservation up to the next 64 KiB.
ALLOCATION_BLOCK = 4096
PARTITION_RESERVE = 328 * 1024 * 1024 + 64 * 1024
COPY_HEADROOM = 128 * 1024 * 1024
# Empty HFS measurements at 1.83/2.13 GB usable capacity consumed exactly
# 392 KiB fixed metadata plus their 4 KiB-rounded allocation bitmaps.
HFS_FIXED_METADATA_RESERVE = 400 * 1024


def capacity_budget(allocation):
    base = allocation + PARTITION_RESERVE + COPY_HEADROOM
    image_mib = math.ceil((base + HFS_FIXED_METADATA_RESERVE) / (1024 * 1024))
    while True:
        # Use the whole image rather than only its HFS partition for a
        # conservative bitmap estimate, including any final MiB rounding.
        bitmap = math.ceil((image_mib * 1024 * 1024 / ALLOCATION_BLOCK / 8) / ALLOCATION_BLOCK) * ALLOCATION_BLOCK
        metadata = HFS_FIXED_METADATA_RESERVE + bitmap
        sized = math.ceil((base + metadata) / (1024 * 1024))
        if sized == image_mib:
            return {"image_size_mib": image_mib, "filesystem_metadata_reserve_bytes": metadata,
                    "filesystem_bitmap_reserve_bytes": bitmap}
        image_mib = sized


def destination_allocation(paths):
    total = 0
    files = 0
    directories = 0
    def allocated(file):
        return math.ceil(file.lstat().st_size / ALLOCATION_BLOCK) * ALLOCATION_BLOCK
    for value in paths:
        root = Path(value)
        if root.is_dir() and not root.is_symlink():
            for current, dirs, names in os.walk(root, followlinks=False):
                directories += 1
                total += ALLOCATION_BLOCK
                for name in names + [name for name in dirs if (Path(current) / name).is_symlink()]:
                    total += allocated(Path(current) / name)
                    files += 1
        else:
            total += allocated(root)
            files += 1
    return {"destination_allocation_bytes": total, "files": files, "directories": directories}


def prepare_capacity(settings_path, evidence):
    settings = json.loads(Path(settings_path).read_text())
    paths = [item["path"] for item in settings.get("contents", []) if item.get("type") == "file"]
    for key in ("icon", "background"):
        if settings.get(key) and Path(settings[key]).is_file():
            paths.append(settings[key])
    report = destination_allocation(paths)
    report["partition_reserve_bytes"] = PARTITION_RESERVE
    report["copy_headroom_bytes"] = COPY_HEADROOM
    report.update(capacity_budget(report["destination_allocation_bytes"]))
    # Preserve an explicitly supplied size; the measured free-space guard still
    # refuses one that cannot hold the complete payload and headroom.
    if settings.get("size") is None:
        settings["size"] = str(report["image_size_mib"]) + "m"
    report["effective_size"] = settings["size"]
    evidence.mkdir(parents=True, exist_ok=True)
    (evidence / "capacity.json").write_text(json.dumps(report, indent=2) + "\n")
    adjusted = evidence / "settings.json"
    adjusted.write_text(json.dumps(settings, indent=2) + "\n")
    return adjusted


def main():
    import dmgbuild.core as core
    actual = hashlib.sha256(Path(core.__file__).read_bytes()).hexdigest()
    if actual != CORE_SHA256:
        raise RuntimeError(f"Unexpected dmgbuild core digest: {actual}")
    evidence = Path(os.environ["WAYLAND_DMG_REPORT_DIR"])
    for flag in ("-s", "--settings"):
        if flag in sys.argv:
            index = sys.argv.index(flag) + 1
            sys.argv[index] = str(prepare_capacity(sys.argv[index], evidence))
            break
    core.subprocess = CheckedCopy(subprocess, evidence)
    from dmgbuild.__main__ import main as vendor_main
    try:
        vendor_main()
    except Exception as error:
        # hdiutil can also fail before the app-copy interceptor is reached.
        # Propagate a deterministic capacity failure to the outer retry policy.
        if "No space left on device" in str(error) or "ENOSPC" in str(error):
            evidence.mkdir(parents=True, exist_ok=True)
            (evidence / "failure.json").write_text(json.dumps({"deterministic": True, "error": str(error)}, indent=2) + "\n")
        raise


if __name__ == "__main__":
    main()
