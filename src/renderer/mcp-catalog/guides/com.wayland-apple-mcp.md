---
guideVersion: 1.1.0
estimatedMinutes: 2
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      The Apple Ecosystem MCP is bundled with Wayland - there's nothing to
      download. It speaks to macOS apps directly through EventKit (Calendar,
      Reminders), AppleScript (Notes, Mail), MapKit (Maps), and the Photos
      framework. macOS only; the entry is hidden on Windows and Linux.

      If the server crashes on launch, click **Reinstall** to rebundle the
      native binary and reset its sandbox.
  - id: full-disk-access
    title: Grant Full Disk Access to Wayland
    estSeconds: 60
    externalAction: { label: "Open System Settings → Privacy & Security", url: "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles" }
    primaryAction: { label: "Done - verify access", action: "verify-fda" }
    body: |
      macOS guards Notes, Mail, and the EventKit databases (Calendar /
      Reminders) behind Full Disk Access. Without it, every tool call returns
      an empty list or a permission error. Photos and Maps each use a separate
      framework consent dialog that pops the first time they're touched.

      1. Click **Open System Settings → Privacy & Security** above. macOS
         opens the **Privacy & Security** pane scrolled to **Full Disk
         Access**.
      2. If **Wayland** is already listed, flip its toggle **on**. If not,
         click the **+** button, navigate to `/Applications/Wayland.app`, and
         click **Open**. macOS will ask for your password or Touch ID.
      3. macOS warns that Wayland must restart to pick up the permission -
         click **Quit & Reopen** (or restart Wayland manually).
      4. Back in Wayland, click **Done - verify access** above. We'll probe
         EventKit and confirm the grant landed.

      First call into Calendar or Reminders may surface a one-time EventKit
      consent dialog - approve it. Photos and Maps do the same on first use.
---

# Apple Ecosystem setup

This MCP reads from and writes to your local macOS apps directly - no cloud,
no API keys, no telemetry. Everything stays on the device.

