---
guideVersion: 1.0.0
estimatedMinutes: 3
steps:
  - id: install-tradingview
    title: 'Install TradingView Desktop'
    body: |
      TVControl drives the **desktop** app on this machine - not tradingview.com in a browser. If you do not have it yet, get it from [tradingview.com/desktop](https://www.tradingview.com/desktop/).

      Any TradingView plan works, including the free one. TVControl reads and drives whatever your account already has.
  - id: enable-control
    title: 'Restart TradingView with control enabled'
    body: |
      This is the one step that actually matters, and TVControl does nothing without it.

      TradingView must be started with its control port open. **Quit TradingView completely first** - relaunching from the Dock is not enough, the port is only opened at startup.

      **macOS** - in Terminal:

      ```
      open -a TradingView --args --remote-debugging-port=9222
      ```

      **Windows** - in PowerShell:

      ```
      & "$env:LOCALAPPDATA\Programs\TradingView\TradingView.exe" --remote-debugging-port=9222
      ```

      **Linux** - in a terminal:

      ```
      /opt/TradingView/tradingview --remote-debugging-port=9222
      ```

      If TradingView came from the Microsoft Store, the command above will not find it. Use the `launch_tv_debug.bat` script shipped in the package, which locates the Store install for you.

      Leave TradingView running. If you quit it, or restart it normally, the tools go quiet until you launch it this way again.
    warning: 'While the control port is open, any program on this computer can drive your signed-in TradingView. The assistant can change your chart - symbol, timeframe, indicators. It cannot place orders and cannot reach your broker.'
  - id: verify
    title: 'Ask for your chart'
    body: |
      In any chat, ask: **"What symbol and timeframe is my TradingView chart on?"**

      A correct answer means everything is wired up. If the assistant says it cannot reach TradingView, it is almost always step 2 - the app is running, but was not started with the control port.
---

# TVControl setup

Drive TradingView Desktop from a conversation: read the live chart, change symbol and timeframe, add and configure indicators, pull OHLCV and the output of your Pine scripts, and take screenshots.

## What it needs

TradingView **Desktop**, running, started with its control port open. There is no account to connect, no API key, and no token - TVControl talks to the copy of TradingView already on this machine.

## Good to know

**It only sees the desktop app.** A chart open in a browser tab is invisible to it.

**It can change your chart.** Asking for a different symbol or timeframe moves the chart you are looking at. It does not place orders, and it cannot access your broker.

**Running arbitrary page JavaScript is off by default.** TVControl ships a `ui_evaluate` tool that is not registered unless you set `TV_MCP_ADVANCED=1` yourself. Leave it unset unless you know precisely why you want it.
