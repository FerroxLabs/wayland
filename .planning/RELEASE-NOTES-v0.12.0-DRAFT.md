# Wayland Desktop 0.12.0

DRAFT. Not published. Version and headline are Sean's call before tagging.

---

## Wayland Nano ships inside Wayland

Nano is now a first-class built-in agent. Pick it like any other engine, and it
runs with your multi-provider credentials already wired in. Budget notices,
compaction notices and a 59-kind error table all surface as readable tips
instead of raw protocol noise, so when something goes sideways you get told what
happened in English.

> PRE-TAG ACTION: Desktop pins `waylandnano@0.1.0-rc.0`. Stable is not on npm
> yet (`latest` still points at `0.1.0-alpha.0`). Update `WNANO_NPM_VERSION` in
> `src/common/types/acpTypes.ts` to the stable version before tagging, or this
> release ships advertising Nano against an RC whose binary is not executable.

## A new engine under the hood

Wayland Core v0.13.0 is bundled and default. Runtime MCP now negotiates cleanly,
so connectors like TVControl come up with their full tool set on the first turn
rather than after a restart.

## You choose your shell

Classic or Cockpit, offered up front instead of buried in settings. Pick once,
change whenever, and Wayland remembers.

## TVControl as a first-class connector

Install it from the Library and drive a live TradingView chart with 101 tools.
Pinned to a verified version, on macOS, Windows and Linux.

## Teams that hold together

Built-in specialists and team rosters now resolve to their real records, so an
imported team arrives with its people intact and its launch button live.

## Sharper on the details

- Your agent list stays put after a reload instead of dropping the view.
- Every agent stays reachable in the picker no matter how many you have installed.
- Ollama only offers you models the daemon says can actually take tools.
- Voice reads the message, not the markup.
- Scheduled tasks confirm with one click, and the confirmation card no longer
  leaks its markup into the chat.
- The web server reports the port it actually bound.
- Screen-reader names on the composer's add and send buttons.
- Engine startup failures tell you the real reason, with secrets scrubbed.

## Under the hood, where it counts

The launch profile no longer touches your project config. Wayland writes its own
config, keeps a journalled backup, and if anything interrupts a launch your file
comes back byte-identical. If you edited it during that window, your edit wins.

---

## Install

Auto-update picks this up on next launch. Fresh installs are on the releases page.
