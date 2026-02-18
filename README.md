# Antigravity: Reveal in File Explorer (WSL)

**Reveal files and folders in Windows File Explorer** when working in WSL Remote sessions.

When VS Code / Antigravity is connected to WSL, the built-in "Reveal in File Explorer" doesn't work. This extension bridges that gap — right-click any file or folder and instantly open it in Windows Explorer with the file highlighted.

## Features

- 📂 **Right-click in Explorer sidebar** → "Reveal in File Explorer"
- 📑 **Right-click an editor tab** → "Reveal in File Explorer"
- 🔍 **Command Palette** → `Antigravity: Reveal in File Explorer`
- ✅ Works with filenames containing spaces and special characters
- ⚡ Fast — uses PowerShell for reliable UNC path handling

## How It Works

1. Converts the WSL path (e.g., `/home/user/project/file.txt`) to a Windows UNC path via `wslpath`
2. Uses `powershell.exe` to launch `explorer /select,"<path>"` from Windows context
3. Windows Explorer opens with the file highlighted

## Requirements

- Running in a WSL Remote session
- `powershell.exe` accessible from WSL (default on Windows 10/11)

## Installation

Install from the VS Code / Antigravity Marketplace, or manually:

```bash
code --install-extension antigravity-reveal-explorer-0.1.0.vsix
```

## Development

```bash
npm install
npm run compile
npm run package
```

## License

[MIT](LICENSE)
