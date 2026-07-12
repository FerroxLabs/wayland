; ARM64 architecture detection for NSIS installer
; Prevents installation on non-ARM64 systems

!include "x64.nsh"

; Check architecture when installer validates install directory
; This is called early in the installer lifecycle and won't conflict with electron-builder
Function .onVerifyInstDir
  ; Block installation on non-ARM64 systems
  ${IfNot} ${IsNativeARM64}
    ; System is not ARM64
    MessageBox MB_OK|MB_ICONSTOP \
      "Installation package architecture mismatch$\n$\n\
      This Wayland installer is designed for ARM64 architecture.$\n$\n\
      Your system does not support ARM64. Please download the appropriate version for your architecture.$\n$\n\
      Download: https://github.com/FerroxLabs/wayland/releases"
    Quit
  ${EndIf}
FunctionEnd

; #139: closing or uninstalling Wayland could leave orphaned processes behind -
; the app plus the bun/node helpers it spawned - which kept holding files in the
; install dir, so the uninstall left files that couldn't be deleted. electron-
; builder's own un.checkAppRunning only handles the main Wayland.exe, not the
; helper processes that outlived it.
;
; customUnInit runs in un.onInit, before the uninstaller removes any files. Kill
; the app's whole process tree, then sweep any process still running from the
; install dir (matched by executable PATH, so unrelated node.exe processes are
; never touched). The uninstaller's own process is excluded by PID so the sweep
; cannot terminate itself mid-uninstall. (Keep in sync with windows-installer-x64.nsh.)
!macro customUnInit
  System::Call 'kernel32::GetCurrentProcessId() i .r9'
  nsExec::Exec 'taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"'
  nsExec::Exec `powershell -NoProfile -ExecutionPolicy Bypass -Command "$$d = '$INSTDIR'; $$self = $9; Get-Process -ErrorAction SilentlyContinue | Where-Object { $$_.Id -ne $$self -and $$_.Path -and $$_.Path.ToLower().StartsWith($$d.ToLower()) } | Stop-Process -Force -ErrorAction SilentlyContinue"`
  Sleep 1500
!macroend

; #490: the running app writes per-user (HKCU) registry entries at runtime that
; electron-builder's uninstaller never removes, so they outlive an uninstall:
;   1. the `wayland://` deep-link handler - app.setAsDefaultProtocolClient(
;      PROTOCOL_SCHEME) in src/index.ts writes HKCU\Software\Classes\wayland on
;      every launch (DeleteRegKey removes the key and its shell\open\command tree).
;   2. the start-on-boot entry - app.setLoginItemSettings (the start-on-boot toggle
;      in applicationBridge.ts) writes HKCU\...\CurrentVersion\Run. Electron names
;      that value with the app's AppUserModelID; this app never calls
;      setAppUserModelId, so Electron falls back to its default `electron.app.<Name>`
;      = electron.app.Wayland. Disabling autostart additionally leaves a binary
;      "disabled" marker under ...\Explorer\StartupApproved\Run under the same name.
;
; customUnInstall is electron-builder's uninstall hook (same mechanism as
; customUnInit above). Remove all three so an uninstall leaves no per-user residue.
; DeleteRegKey / DeleteRegValue are silent no-ops when the entry is absent, so this
; is safe whether or not the user ever set the deep-link default or enabled autostart.
;
; CAVEAT (perMachine: true): the app writes these under the HKCU of whichever user
; ran it, but a per-machine uninstaller runs elevated, so HKCU here is the elevating
; admin's hive. Residue under OTHER users' hives on a multi-user machine is not
; reachable without enumerating every loaded profile (out of scope); this cleans the
; common single-user case. (Keep in sync with windows-installer-x64.nsh.)
!macro customUnInstall
  ; Only scrub on a GENUINE uninstall. electron-builder runs the OLD version's
  ; uninstaller in update mode on every app update (uninstallOldVersion ->
  ; ExecWait ... /KEEP_APP_DATA --updated), and this hook fires there too. Deleting
  ; the start-on-boot value on an update would silently disable autostart with no
  ; self-heal - setStartOnBootEnabled only re-runs via the one-time first-run
  ; defaults or the user's Settings toggle - so gate every removal on a real
  ; uninstall via ${isUpdated}, matching the template's own file-removal gating.
  ${IfNot} ${isUpdated}
    DeleteRegKey HKCU "Software\Classes\wayland"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Wayland"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.Wayland"
  ${EndIf}
!macroend
