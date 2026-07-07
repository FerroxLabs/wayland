# Antivirus exclusions for Wayland

Some antivirus products flag Wayland — or its bundled engine, `wayland-core.exe` —
even though it is a legitimate, code-signed application. This is a **behavioral
false positive**, not a sign that anything is wrong. This guide explains why it
happens and how to add narrowly-scoped exclusions without weakening your overall
protection.

> Keep your antivirus on. The steps below add *targeted* exceptions for Wayland's
> own executables and folders. They do not disable real-time protection or
> behavioral monitoring for anything else on your machine.

## Why a developer tool trips antivirus

Modern antivirus does two different things, and Wayland can trip either one:

1. **Behavioral detection** (Bitdefender Advanced Threat Defense, Microsoft
   Defender behavior monitoring, and similar engines) watches what a running
   program *does*. Wayland is an AI development agent, so by design it spawns
   child processes, writes and runs scripts and executables, automates other
   tools, and touches many files quickly. Those are exactly the behaviors a
   behavioral engine is built to be suspicious of — even though, for Wayland,
   they are the entire point of the application.

2. **Real-time file scanning** re-scans files every time they are read or
   written. During heavy agent work Wayland reads and writes a lot of files very
   quickly, and constant re-scanning can both cause false alerts and noticeably
   slow things down.

Neither is a defect in Wayland or in your antivirus. It is the well-understood
friction between security heuristics and automation tooling, which is why every
major antivirus vendor provides an exclusion mechanism for exactly this
situation.

Wayland's Windows builds are Authenticode **code-signed by Ferrox Labs, LLC**, so
your antivirus can verify the publisher — but signing alone does not stop a
purely behavioral engine from acting on what the process does at runtime.

## What to exclude

You typically need two kinds of exclusion. Add the behavioral (process)
exclusions first — they resolve most "Wayland was quarantined / killed mid-task"
reports.

### 1. Behavioral / process exclusions

Exclude Wayland's executables from behavioral and advanced-threat monitoring:

- `wayland.exe` — the desktop application
- `wayland-core.exe` — the bundled engine that runs your agents

### 2. Real-time scanning (folder) exclusions

Exclude Wayland's install directory, which contains both executables above and
the bundled engine:

```
C:\Program Files\Wayland\
```

That single folder covers the app and the bundled engine at
`C:\Program Files\Wayland\resources\bundled-wayland-core\win32-x64\wayland-core.exe`.

**If you use a custom engine override** (an advanced setup where you place your
own `wayland-core` binary for Wayland to prefer), also exclude:

```
%APPDATA%\wayland\wayland-core-overrides\win32-x64\wayland-core.exe
```

This override location does not exist on a normal install — add it only if you
have deliberately created it.

### 3. Your project folders (optional, for speed)

If real-time scanning is slowing Wayland down while it works, add a real-time
scanning exclusion for the parent folder where you keep your projects (for
example `C:\Users\<you>\dev\`). This is a performance exclusion, not a
false-positive fix — scope it to your own project tree, not your whole user
profile.

## How to add exclusions (Microsoft Defender)

Settings that ship with Windows use Microsoft Defender:

1. Open **Windows Security** → **Virus & threat protection**.
2. Under **Virus & threat protection settings**, click **Manage settings**.
3. Scroll to **Exclusions** → **Add or remove exclusions**.
4. Add a **Folder** exclusion for `C:\Program Files\Wayland\`.
5. Add **Process** exclusions for `wayland.exe` and `wayland-core.exe`.

Other vendors (Bitdefender, Norton, Avast, Kaspersky, ESET, and others) provide
the same two concepts — an **exception/exclusion** list for folders/files and a
separate **behavioral/advanced-threat** exception list. Add Wayland's folder to
the first and its two executables to the second. Consult your vendor's
documentation for the exact menu names.

## If Wayland was already quarantined

If your antivirus already removed or blocked `wayland.exe` or `wayland-core.exe`,
restore it from quarantine first, then add the exclusions above so it is not
quarantined again. If the engine binary was removed, reinstalling Wayland
restores it.

## Reporting the false positive

Adding an exclusion fixes it for you. Reporting the false positive to your
antivirus vendor helps fix it for everyone — vendors correct their behavioral
rules once a legitimate signed application is confirmed. Most vendors have a
"report a false positive" or "submit a file for analysis" page; submit
`wayland.exe` and note that it is Authenticode-signed by Ferrox Labs, LLC.

---

*Thanks to community contributor **frakman** for the detailed writeup that this
guide is based on.*
