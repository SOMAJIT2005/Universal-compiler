const vscode = require('vscode');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

let runTerminal = null;
let lastOutPath = null; // Track the previous executable to delete it later

function activate(context) {
    let disposable = vscode.commands.registerCommand('offline-cpp-runner.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const doc = editor.document;
        if (doc.languageId !== 'c' && doc.languageId !== 'cpp') {
            vscode.window.showErrorMessage('Please open a C or C++ file.');
            return;
        }

        await doc.save();
        const filePath = doc.fileName;
        const fileName = path.parse(filePath).name;

        // SMART CLEANUP: Delete the previously compiled file to keep the Temp folder spotless
        if (lastOutPath && fs.existsSync(lastOutPath)) {
            try {
                fs.unlinkSync(lastOutPath);
            } catch (e) {
                // Ignore silently if the old terminal process is still hanging on to the file
            }
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Compiling code...",
            cancellable: false
        }, () => {
            return new Promise((resolve) => {
                let compileCmd;
                let outPath;
                let customEnv = Object.assign({}, process.env);

                if (os.platform() === 'win32') {
                    const compilerFolder = path.join(__dirname, '..', 'compiler', 'w64devkit', 'bin');
                    const compilerPath = path.join(compilerFolder, 'g++.exe');
                    
                    if (!fs.existsSync(compilerPath)) {
                        vscode.window.showErrorMessage('Compiler not found! Ensure the extension built correctly.');
                        resolve();
                        return;
                    }

                    outPath = path.join(os.tmpdir(), `${fileName}_${Date.now()}.exe`);
                    lastOutPath = outPath; // Save path for the next cleanup cycle
                    
                    customEnv.PATH = `${compilerFolder};${process.env.PATH}`;
                    compileCmd = `"${compilerPath}" "${filePath}" -o "${outPath}"`;
                } else {
                    outPath = path.join(os.tmpdir(), `${fileName}_${Date.now()}`);
                    lastOutPath = outPath;
                    compileCmd = `g++ "${filePath}" -o "${outPath}"`;
                }
                
                exec(compileCmd, { env: customEnv }, (err, stdout, stderr) => {
                    resolve();
                    if (err) {
                        vscode.window.showErrorMessage(`Compilation Error:\n${stderr}`);
                        return;
                    }

                    if (!runTerminal || runTerminal.exitStatus !== undefined) {
                        runTerminal = vscode.window.createTerminal('C++ CP Runner');
                    }
                    
                    runTerminal.show(false); 
                    vscode.commands.executeCommand('workbench.action.terminal.clear');
                    
                    if (os.platform() === 'win32') {
                        runTerminal.sendText(`& "${outPath}"`);
                    } else {
                        runTerminal.sendText(`"${outPath}"`);
                    }
                });
            });
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
    // Final cleanup: delete the last file when VS Code is closed
    if (lastOutPath && fs.existsSync(lastOutPath)) {
        try { fs.unlinkSync(lastOutPath); } catch (e) {}
    }
}

module.exports = {
    activate,
    deactivate
};