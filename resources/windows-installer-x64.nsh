; x64 architecture detection for NSIS installer
; Prevents installation on ARM64 or x86 systems

!include "x64.nsh"

; Check architecture when installer validates install directory
; This is called early in the installer lifecycle and won't conflict with electron-builder
Function .onVerifyInstDir
  ; Block installation on x86 (32-bit) systems first
  ; Must check BEFORE ARM64, since ARM64 with WOW64 may report RunningX64=true
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP \
      "Installation package architecture mismatch$\n$\n\
      This Wayland installer is designed for x64 architecture.$\n$\n\
      Your system is 32-bit architecture. Please download the appropriate version for your architecture.$\n$\n\
      Download: https://github.com/FerroxLabs/wayland/releases"
    Quit
  ${EndIf}

  ; Block installation on ARM64 systems
  ${If} ${IsNativeARM64}
    MessageBox MB_OK|MB_ICONSTOP \
      "Installation package architecture mismatch$\n$\n\
      This Wayland installer is designed for x64 architecture.$\n$\n\
      Your system is ARM64 architecture. Please download the ARM64 version.$\n$\n\
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
; cannot terminate itself mid-uninstall. (Keep in sync with windows-installer-arm64.nsh.)
!macro customUnInit
  System::Call 'kernel32::GetCurrentProcessId() i .r9'
  nsExec::Exec 'taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"'
  nsExec::Exec `powershell -NoProfile -ExecutionPolicy Bypass -Command "$$d = '$INSTDIR'; $$self = $9; Get-Process -ErrorAction SilentlyContinue | Where-Object { $$_.Id -ne $$self -and $$_.Path -and $$_.Path.ToLower().StartsWith($$d.ToLower()) } | Stop-Process -Force -ErrorAction SilentlyContinue"`
  Sleep 1500
!macroend
