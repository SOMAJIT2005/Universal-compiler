const vscode = require('vscode');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { selectRuntime, planRun, runtimeEnv, powershellCommand } = require('./runner');
const compile = promisify(execFile);

function activate(context) {
    const output = vscode.window.createOutputChannel('Offline Code Runner');
    context.subscriptions.push(output);
    context.subscriptions.push(vscode.commands.registerCommand('offline-cpp-runner.run', async () => {
        let work;
        let terminal;
        try {
            if (!vscode.workspace.isTrusted) throw new Error('Trust this workspace before running code.');
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const doc = editor.document;
            if (!['c', 'cpp', 'python', 'java'].includes(doc.languageId)) throw new Error('Open a C, C++, Python, or Java file.');
            const runtime = selectRuntime(context.extensionPath);
            if (!await doc.save()) return;
            if (doc.uri.scheme !== 'file') throw new Error('Save the code to a local file before running it.');
            work = fs.mkdtempSync(path.join(os.tmpdir(), 'offline-runner-'));
            const plan = planRun(runtime, doc.languageId, doc.fileName, work, doc.getText());
            const env = runtimeEnv(runtime);
            const cwd = path.dirname(doc.fileName);
            if (plan.compile) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification, title: 'Compiling code...', cancellable: false
                }, () => compile(plan.compile.file, plan.compile.args, { cwd, env, windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024 }));
            }
            // Explicit shell avoids assuming that the user's default terminal is PowerShell.
            terminal = vscode.window.createTerminal({
                name: 'Offline Code Runner', cwd, env,
                shellPath: path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
                shellArgs: ['-NoLogo', '-NoProfile']
            });
            const cleanup = vscode.window.onDidCloseTerminal(closed => {
                if (closed === terminal) {
                    fs.rmSync(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
                    cleanup.dispose();
                }
            });
            context.subscriptions.push(terminal, cleanup);
            terminal.show(false);
            terminal.sendText(powershellCommand(plan.run.file, plan.run.args));
        } catch (error) {
            if (work && !terminal) fs.rmSync(work, { recursive: true, force: true });
            output.appendLine(error.stderr || error.message);
            output.show(true);
            vscode.window.showErrorMessage(`Run failed: ${error.message}`);
        }
    }));
}

module.exports = { activate, deactivate() {} };
