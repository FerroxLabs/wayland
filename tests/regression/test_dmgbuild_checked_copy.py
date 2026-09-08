import importlib.util
import json
import plistlib
from pathlib import Path
import shutil
import subprocess
import tempfile
import types
import unittest

SPEC = importlib.util.spec_from_file_location("checked_copy", Path(__file__).resolve().parents[2] / "scripts/lib/dmgbuild_checked_copy.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CheckedCopyTests(unittest.TestCase):
    def fixture(self, copy_exit=0, omit_framework=False, invalid=False):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        source = root / "source.app"
        for relative in ["Contents/MacOS/Wayland", "Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"]:
            file = source / relative
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(b"signed fixture executable")
        (source / "Contents/Info.plist").write_bytes(plistlib.dumps({"CFBundleExecutable":"Wayland"}))
        destination = root / "mounted.app"
        calls = []

        def run(args, **kwargs):
            calls.append(args)
            if args[0] == "/usr/bin/ditto":
                if not copy_exit:
                    shutil.copytree(source, destination)
                    if omit_framework:
                        (destination / "Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework").unlink()
                return subprocess.CompletedProcess(args, copy_exit, "", "fixture copy error" if copy_exit else "")
            return subprocess.CompletedProcess(args, 1 if invalid and args[-1] == str(destination) else 0, "", "signature check")

        original = types.SimpleNamespace(run=run, call=lambda *args, **kwargs: 7)
        evidence = root / "evidence"
        return MODULE.CheckedCopy(original, evidence), ["/usr/bin/ditto", str(source), str(destination)], evidence, calls

    def test_success_verifies_before_returning_to_vendor(self):
        checked, args, evidence, calls = self.fixture()
        self.assertEqual(checked.call(args), 0)
        self.assertEqual([call[0] for call in calls], ["/usr/bin/codesign", "/usr/bin/ditto", "/usr/bin/codesign"])
        self.assertTrue(json.loads((evidence / "preconversion-app-copy.json").read_text())["matches"])

    def test_nonzero_copy_is_fatal_and_preserves_stderr(self):
        checked, args, evidence, calls = self.fixture(copy_exit=28)
        with self.assertRaises(subprocess.CalledProcessError):
            checked.call(args)
        report = json.loads((evidence / "preconversion-app-copy.json").read_text())
        self.assertEqual(report["ditto"]["exit"], 28)
        self.assertEqual(report["ditto"]["stderr"], "fixture copy error")
        self.assertEqual(len(calls), 2)

    def test_missing_framework_blocks_even_if_ditto_returns_zero(self):
        checked, args, evidence, calls = self.fixture(omit_framework=True)
        with self.assertRaisesRegex(RuntimeError, "pre-conversion"):
            checked.call(args)
        report = json.loads((evidence / "preconversion-app-copy.json").read_text())
        self.assertFalse(report["matches"])

    def test_invalid_destination_signature_blocks(self):
        checked, args, evidence, calls = self.fixture(invalid=True)
        with self.assertRaisesRegex(RuntimeError, "pre-conversion"):
            checked.call(args)

    def test_capacity_counts_destination_entries_even_when_source_files_are_hardlinked(self):
        checked, args, evidence, calls = self.fixture()
        import os
        source = Path(args[1])
        a = source / "Contents/MacOS/Wayland"
        os.link(a, a.parent / "hardlinked-copy")
        measured = MODULE.destination_allocation([source])
        self.assertEqual(measured["files"], 4)
        self.assertGreaterEqual(measured["destination_allocation_bytes"], 4 * 4096)

    def test_capacity_adds_measured_gpt_reserve_without_a_payload_multiplier(self):
        checked, args, evidence, calls = self.fixture()
        settings = evidence.parent / "settings.json"
        settings.write_text(json.dumps({"contents":[{"type":"file","path":args[1]}]}))
        adjusted = MODULE.prepare_capacity(settings, evidence)
        report = json.loads((evidence / "capacity.json").read_text())
        required = report["destination_allocation_bytes"] + MODULE.PARTITION_RESERVE + MODULE.COPY_HEADROOM + report["filesystem_metadata_reserve_bytes"]
        import math
        self.assertEqual(report["image_size_mib"], math.ceil(required / 1024**2))
        self.assertEqual(json.loads(adjusted.read_text())["size"], str(report["image_size_mib"])+"m")

    def test_mib_aligned_payload_does_not_rely_on_rounding_for_hfs_metadata(self):
        mib = 1024 * 1024
        allocation = 2500 * mib - MODULE.PARTITION_RESERVE - MODULE.COPY_HEADROOM
        old_image = allocation + MODULE.PARTITION_RESERVE + MODULE.COPY_HEADROOM
        budget = MODULE.capacity_budget(allocation)
        self.assertGreater(budget["image_size_mib"] * mib, old_image)
        self.assertGreaterEqual(budget["image_size_mib"] * mib - MODULE.PARTITION_RESERVE - budget["filesystem_metadata_reserve_bytes"], allocation + MODULE.COPY_HEADROOM)
        self.assertLess(old_image - MODULE.PARTITION_RESERVE - budget["filesystem_metadata_reserve_bytes"], allocation + MODULE.COPY_HEADROOM)

    def test_precopy_floor_does_not_count_already_copied_layout_assets_twice(self):
        checked, args, evidence, calls = self.fixture()
        allocation = MODULE.destination_allocation([args[1]])["destination_allocation_bytes"]
        evidence.mkdir()
        (evidence / "capacity.json").write_text(json.dumps({"destination_allocation_bytes":allocation + 8 * 1024**2}))
        from unittest.mock import patch
        available = allocation + MODULE.COPY_HEADROOM + 4096
        with patch.object(MODULE.os, "statvfs", return_value=types.SimpleNamespace(f_bavail=available // 4096, f_frsize=4096)):
            self.assertEqual(checked.call(args), 0)
        self.assertEqual(json.loads((evidence / "preconversion-app-copy.json").read_text())["required_allocation"], allocation)

    def test_insufficient_measured_capacity_fails_before_copy_and_marks_no_retry(self):
        checked, args, evidence, calls = self.fixture()
        evidence.mkdir()
        (evidence / "capacity.json").write_text(json.dumps({"destination_allocation_bytes":4096}))
        from unittest.mock import patch
        with patch.object(MODULE.os, "statvfs", return_value=types.SimpleNamespace(f_bavail=1, f_frsize=4096)):
            with self.assertRaisesRegex(RuntimeError, "Insufficient writable image capacity"):
                checked.call(args)
        self.assertEqual(calls, [])
        self.assertTrue(json.loads((evidence / "failure.json").read_text())["deterministic"])

    def test_unrelated_subprocess_calls_are_unchanged(self):
        checked, args, evidence, calls = self.fixture()
        self.assertEqual(checked.call(["/usr/bin/SetFile", "-a", "E"]), 7)
        self.assertFalse(evidence.exists())


if __name__ == "__main__":
    unittest.main()
