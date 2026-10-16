const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const runner = require('../src/runner');

function extension(options = {}) {
    let command;
    let closed;
    const errors = [];
    const terminals = [];
    const compileCalls = [];
    const doc = {
        languageId: options.language || 'cpp', fileName: '/tmp/Hello.cpp', uri: { scheme: 'file' },
        save: async () => options.saved !== false, getText: () => ''
    };
    const vscode = {
        workspace: { isTrusted: options.trusted !== false },
        ProgressLocation: { Notification: 1 },
        commands: { registerCommand: (_, callback) => { command = callback; return { dispose() {} }; } },
        window: {
            activeTextEditor: { document: doc },
            createOutputChannel: () => ({ appendLine() {}, show() {}, dispose() {} }),
            showErrorMessage: message => errors.push(message),
            withProgress: (_, callback) => callback(),
            onDidCloseTerminal: callback => { closed = callback; return { dispose() {} }; },
            createTerminal: config => {
                const terminal = { config, show() {}, sendText(text) { terminal.text = text; }, dispose() {} };
                terminals.push(terminal);
                return terminal;
            }
        }
    };
    const context = { extensionPath: '/extension', subscriptions: [] };
    const module = { exports: {} };
    const dependencies = {
        vscode,
        './runner': { ...runner, selectRuntime: () => '/bundle' },
        child_process: { execFile: (file, args, opts, callback) => {
            compileCalls.push({ file, args, opts });
            callback(options.compileError ? Object.assign(new Error('invalid code'), { stderr: 'syntax error' }) : null, '', '');
        } }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/extension.js'), 'utf8'), {
        module, exports: module.exports, require: name => dependencies[name] || require(name), process
    });
    module.exports.activate(context);
    return { run: () => command(), close: () => closed(terminals[0]), errors, terminals, compileCalls };
}

test('untrusted workspaces cannot compile or open terminals', async () => {
    const app = extension({ trusted: false });
    await app.run();
    assert.match(app.errors[0], /Trust/);
    assert.equal(app.compileCalls.length, 0);
    assert.equal(app.terminals.length, 0);
});
test('cancelled saves and unsupported languages do not run', async () => {
    for (const options of [{ saved: false }, { language: 'fortran' }]) {
        const app = extension(options);
        await app.run();
        assert.equal(app.compileCalls.length, 0);
        assert.equal(app.terminals.length, 0);
    }
});
test('compiler failures show an error and remove temporary output without launching', async () => {
    const app = extension({ compileError: true });
    await app.run();
    assert.match(app.errors[0], /invalid code/);
    assert.equal(app.terminals.length, 0);
    const output = app.compileCalls[0].args.at(-1);
    assert.equal(fs.existsSync(path.dirname(output)), false);
});
test('compiled programs use the explicit PowerShell terminal and clean up on close', async () => {
    const app = extension();
    await app.run();
    assert.equal(app.errors.length, 0);
    assert.match(app.terminals[0].config.shellPath, /powershell.exe$/);
    assert.equal(app.compileCalls[0].opts.shell, undefined);
    const output = app.compileCalls[0].args.at(-1);
    assert.ok(fs.existsSync(path.dirname(output)));
    assert.equal(app.terminals[0].text, runner.powershellCommand(output, []));
    app.close();
    assert.equal(fs.existsSync(path.dirname(output)), false);
});
test('Python starts its bundled interpreter without invoking a compiler', async () => {
    const app = extension({ language: 'python' });
    await app.run();
    assert.equal(app.errors.length, 0);
    assert.equal(app.compileCalls.length, 0);
    assert.match(app.terminals[0].text, /python.exe/);
    app.close();
});
