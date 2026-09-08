"""Instrument only pinned dmgbuild's app copy; never edit its installed package."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

CORE_SHA256 = "27137ae996ad1984e98fba3adfba92730888d1e75c3e3baa9a5be937dabf9844"


def file_digest(file):
    with file.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def identity(app, run):
    result = {"app": str(app), "files": {}}
    for relative in ["Contents/MacOS/Wayland", "Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"]:
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
        try:
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
            if not destination["valid"] or not report["matches"]:
                raise RuntimeError("Copied app failed pre-conversion signature or executable identity checks")
            return 0
        except Exception as error:
            report["error"] = str(error)
            if isinstance(error, subprocess.TimeoutExpired):
                report["timeout_seconds"] = error.timeout
                report["stderr"] = str(error.stderr or "")
            raise
        finally:
            (self.evidence / "preconversion-app-copy.json").write_text(json.dumps(report, indent=2) + "\n")


def main():
    if os.environ.get("WAYLAND_INTEL_NOTARY_DIAGNOSTIC") != "1":
        raise RuntimeError("Intel diagnostic opt-in required")
    import dmgbuild.core as core
    actual = hashlib.sha256(Path(core.__file__).read_bytes()).hexdigest()
    if actual != CORE_SHA256:
        raise RuntimeError(f"Unexpected dmgbuild core digest: {actual}")
    evidence = os.environ["WAYLAND_DMG_DIAGNOSTIC_DIR"]
    core.subprocess = CheckedCopy(subprocess, evidence)
    from dmgbuild.__main__ import main as vendor_main
    vendor_main()


if __name__ == "__main__":
    main()
