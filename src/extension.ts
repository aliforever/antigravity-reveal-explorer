import * as vscode from "vscode";
import { exec, execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Convert a WSL Linux path to a Windows path using `wslpath -w`.
 */
async function toWindowsPath(linuxPath: string): Promise<string> {
  const { stdout } = await promisify(execFile)("wslpath", ["-w", linuxPath]);
  return stdout.trim();
}

/**
 * Open Windows Explorer with the given file/folder selected.
 * Uses powershell.exe to launch explorer from Windows context,
 * which makes /select work reliably with UNC WSL paths (including spaces).
 */
async function revealInWindowsExplorer(linuxPath: string): Promise<void> {
  const windowsPath = await toWindowsPath(linuxPath);
  const normalized = windowsPath.replace(/\//g, "\\");

  // PowerShell runs explorer entirely in Windows context, fixing /select for UNC paths.
  // execFile passes args directly — no bash shell escaping issues.
  const psCommand = `explorer /select,"${normalized}"`;
  const psPath = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";

  return new Promise((resolve, reject) => {
    execFile(psPath, ["-NoProfile", "-Command", psCommand], (err) => {
      if (err) {
        // Fallback to powershell.exe in PATH just in case
        execFile("powershell.exe", ["-NoProfile", "-Command", psCommand], (fallbackErr) => {
          if (fallbackErr) {
            reject(new Error(`Could not launch PowerShell to open Explorer.\nAbsolute path error: ${err.message}\nPATH error: ${fallbackErr.message}`));
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * Resolve the target file path from the command arguments.
 */
function resolveFilePath(arg: unknown): string | undefined {
  if (arg instanceof vscode.Uri) {
    return arg.fsPath;
  }

  // Handle duck-typed URIs or tree nodes from custom explorers
  if (arg && typeof arg === "object") {
    // Some IDEs pass tree nodes with 'uri' or 'resourceUri'
    const uriObj = (arg as any).uri || (arg as any).resourceUri || arg;

    if (typeof uriObj.fsPath === "string" && uriObj.fsPath) {
      return uriObj.fsPath;
    }
    
    if (typeof uriObj.path === "string" && uriObj.path) {
      return uriObj.path;
    }
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    return activeEditor.document.uri.fsPath;
  }

  return undefined;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "antigravity.revealInExplorer",
    async (arg?: unknown) => {
      const filePath = resolveFilePath(arg);

      if (!filePath) {
        vscode.window.showWarningMessage(
          "No file selected. Open a file or right-click one in the explorer."
        );
        return;
      }

      try {
        await revealInWindowsExplorer(filePath);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        vscode.window.showErrorMessage(
          `Failed to reveal file in Explorer: ${message}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
