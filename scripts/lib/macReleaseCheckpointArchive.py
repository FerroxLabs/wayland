#!/usr/bin/env python3
"""Validate the opaque Mac checkpoint before writing any extracted member."""
import hashlib
import json
import pathlib
import posixpath
import stat
import sys
import tarfile
import zipfile

MEMBERS = {"checkpoint.json", "payload.zip", "zip.blockmap", "zip-update.yml"}


def inspect(archive):
    members = archive.getmembers()
    if len(members) != len(MEMBERS) or {m.name for m in members} != MEMBERS:
        raise ValueError("checkpoint has duplicate, missing or unexpected members")
    if any(not m.isfile() or m.issym() or m.islnk() for m in members):
        raise ValueError("checkpoint members must be regular files")
    metadata = archive.getmember("checkpoint.json")
    if metadata.size > 65536:
        raise ValueError("checkpoint metadata is too large")
    receipt = json.load(archive.extractfile(metadata))
    if set(receipt["files"]) != MEMBERS - {"checkpoint.json"}:
        raise ValueError("checkpoint file inventory differs")
    for name, expected in receipt["files"].items():
        member = archive.getmember(name)
        digest = hashlib.file_digest(archive.extractfile(member), "sha256").hexdigest()
        if member.size != expected["size"] or digest != expected["sha256"]:
            raise ValueError("checkpoint payload digest differs: " + name)
    # The outer TAR never contains links. The signed app ZIP legitimately does
    # (Frameworks/Versions/Current), but no entry/link may escape its app root.
    with zipfile.ZipFile(archive.extractfile("payload.zip")) as zipped:
        names = set()
        app = receipt["appName"]
        if pathlib.PurePosixPath(app).name != app or not app.endswith(".app"):
            raise ValueError("invalid app name")
        for entry in zipped.infolist():
            name = entry.filename.rstrip("/")
            parts = pathlib.PurePosixPath(name).parts
            if name in names or str(pathlib.PurePosixPath(name)) != name or not parts or parts[0] != app or ".." in parts or "\\" in name:
                raise ValueError("unsafe or duplicate app ZIP entry")
            names.add(name)
            kind = stat.S_IFMT(entry.external_attr >> 16)
            if kind == stat.S_IFLNK:
                if entry.file_size > 4096:
                    raise ValueError("invalid app ZIP symlink target length")
                target = zipped.read(entry).decode("utf-8")
                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
                if target.startswith("/") or "\\" in target or not resolved.startswith(app + "/"):
                    raise ValueError("app ZIP symlink escapes app")
            elif kind not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise ValueError("unsupported app ZIP entry type")
    return receipt


def main():
    action, archive_path, *rest = sys.argv[1:]
    if action == "unwrap":
        destination, expected_digest = rest
        with open(archive_path, "rb") as source:
            if "sha256:" + hashlib.file_digest(source, "sha256").hexdigest() != expected_digest:
                raise ValueError("GitHub checkpoint artifact digest differs")
        with zipfile.ZipFile(archive_path) as zipped:
            entries = zipped.infolist()
            if len(entries) != 1 or entries[0].filename != "checkpoint.tar" or entries[0].is_dir():
                raise ValueError("unexpected GitHub checkpoint artifact members")
            if stat.S_IFMT(entries[0].external_attr >> 16) not in (0, stat.S_IFREG):
                raise ValueError("GitHub checkpoint artifact member is not regular")
            with open(destination, "xb") as output, zipped.open(entries[0]) as source:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
        return
    if action == "create":
        source = pathlib.Path(rest[0])
        with tarfile.open(archive_path, "x", format=tarfile.USTAR_FORMAT) as archive:
            for name in sorted(MEMBERS):
                item = source / name
                if item.is_symlink() or not item.is_file():
                    raise ValueError("checkpoint input is not a regular file")
                archive.add(item, arcname=name, recursive=False)
        return
    with tarfile.open(archive_path, "r:") as archive:
        receipt = inspect(archive)
        if action == "inspect":
            print(json.dumps(receipt))
        elif action == "extract":
            destination = pathlib.Path(rest[0])
            if not destination.is_dir() or any(destination.iterdir()):
                raise ValueError("checkpoint extraction requires an empty directory")
            # No extractall: fixed regular files only, after the complete check.
            for name in sorted(MEMBERS):
                with (destination / name).open("xb") as output:
                    source = archive.extractfile(name)
                    while chunk := source.read(1024 * 1024):
                        output.write(chunk)
        else:
            raise ValueError("unknown checkpoint action")


if __name__ == "__main__":
    main()
