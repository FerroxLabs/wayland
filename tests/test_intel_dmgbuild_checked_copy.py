import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import types
import unittest

SPEC = importlib.util.spec_from_file_location("checked_copy", Path(__file__).parent.parent / "scripts/intel_dmgbuild_checked_copy.py")
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

    def test_unrelated_subprocess_calls_are_unchanged(self):
        checked, args, evidence, calls = self.fixture()
        self.assertEqual(checked.call(["/usr/bin/SetFile", "-a", "E"]), 7)
        self.assertFalse(evidence.exists())


if __name__ == "__main__":
    unittest.main()
