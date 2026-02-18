import * as vscode from "vscode";
import { exec, execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Convert a WSL Linux path to a Windows path using `wslpath -w`.
 */
async function toWindowsPath(linuxPath: string): Promise<string> {
  const { stdout } = await execAsync(`wslpath -w "${linuxPath}"`);
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
  execFile("powershell.exe", ["-NoProfile", "-Command", psCommand], () => {
    // Intentionally ignore exit code
  });
}

/**
 * Resolve the target file path from the command arguments.
 */
function resolveFilePath(arg: unknown): string | undefined {
  if (arg instanceof vscode.Uri) {
    return arg.fsPath;
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
