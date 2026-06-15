# Wayland Teams — native built-in catalog

This directory is the **native, shipped-with-the-app** catalog of Wayland
specialists and ready-made teams (88 records: 28 specialists + 60 teams),
their context bodies, skills, and icons.

**It is not a user-installable plugin.** Unlike the business packs under
`resources/bundled-extensions/` (which are copied into `<userData>/extensions/`
on first run and can be enabled/disabled/removed), this catalog:

- loads **unconditionally** from `Resources/builtin-teams/` on every boot,
- is flagged `isBuiltin` so it cannot be disabled or removed,
- is **never** copied into `<userData>` — it is read straight from Resources.

It loads through the standard extension pipeline (`ExtensionLoader` →
`ExtensionRegistry` → `resolveAssistants`/`resolveSkills`) via the dedicated
`builtin` scan source, so context files, icons, skills, and i18n resolve
through the same proven code paths as any extension — but with built-in
semantics.

## Source of truth

The canonical content lives in `~/dev/waylandteams` (authored separately to
keep it out of the main build's way). This tree is the vendored, committed
copy that actually ships. In development, a live `~/dev/waylandteams` symlink
exposed via `WAYLAND_EXTENSIONS_PATH` shares the same extension `name`
(`waylandteams-specialist-bundle`) and therefore **overrides** this built-in
copy (name-level dedup keeps the higher-priority `env` source), so local edits
are seen immediately. In a packaged build there is no symlink, so this copy is
authoritative.

## Layout

```
aion-extension.json          manifest ($file: refs to contributes/)
contributes/
  assistants.json            88 records (enriched: kickoffs, teammates, rituals, standing)
  skills.json                88 waylandteams methodology skills
assistants/
  roles/*.md                 28 specialist context bodies
  launchers/*.md             60 team launcher context bodies
icons/*.svg                  88 icons (one per record, referenced by avatar)
i18n/en-US/                  locale strings (reserved for future use)
skills/**/*.md               88 skill bodies referenced by contributes/skills.json
```

## When updating

Re-vendor from `~/dev/waylandteams` (records from the enriched in-repo
snapshot if kickoffs were spliced there; bodies/icons/skills from the source),
then re-run the reference-integrity check: every record's `contextFile` and
`avatar` must resolve inside this tree, and every `enabledSkills` entry must
resolve against this `skills.json` + `skills-library` + the business packs
(the sole expected non-skill reference is `cron`, a builtin tool).
