const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { selectRuntime, planRun, powershellCommand } = require('../src/runner');

test('requires Windows and rejects unsupported CPUs and mismatched bundles', () => {
    assert.throws(() => selectRuntime('/extension', 'linux', 'x64'), /Windows/);
    assert.throws(() => selectRuntime('/extension', 'win32', 'arm64'), /architecture/);
    assert.throws(() => selectRuntime('/missing', 'win32', 'ia32'), /bundle/);
});
test('C uses gcc, C++ uses g++, and compiler arguments are separate from the shell', () => {
    const runtime = '/bundle';
    for (const [lang, exe] of [['c', 'gcc.exe'], ['cpp', 'g++.exe']]) {
        const plan = planRun(runtime, lang, '/source/a & b.c', '/temp/job');
        assert.equal(path.basename(plan.compile.file), exe);
        assert.ok(plan.compile.args.includes('/source/a & b.c'));
        assert.equal(plan.run.file, path.join('/temp/job', 'program.exe'));
    }
});
test('Python runs the bundled interpreter with no compilation', () => {
    const plan = planRun('/bundle', 'python', '/src/script.py', '/temp/job');
    assert.equal(plan.compile, undefined);
    assert.equal(plan.run.file, path.join('/bundle', 'python', 'python.exe'));
});
test('Java compiles into an isolated directory and runs a packaged class', () => {
    const plan = planRun('/bundle', 'java', '/src/Hello.java', '/temp/job', '/* package wrong; */\npackage demo.app;\npublic class Hello {}');
    assert.equal(path.basename(plan.compile.file), 'javac.exe');
    assert.deepEqual(plan.run.args, ['-cp', '/temp/job', 'demo.app.Hello']);
});
test('Fortran is rejected', () => {
    assert.throws(() => planRun('/bundle', 'fortran', 'a.f90', '/tmp'), /Unsupported/);
});
test('PowerShell quotes paths and arguments literally', () => {
    assert.equal(powershellCommand("C:\\O'Brien\\python.exe", ['a $(whoami) & b.py']), "& 'C:\\O''Brien\\python.exe' 'a $(whoami) & b.py'");
});

test('runtime environment isolates Python and Java and preserves Windows Path once', () => {
    const { runtimeEnv } = require('../src/runner');
    const env = runtimeEnv('/bundle', { Path: 'system-tools', PYTHONHOME: 'wrong', PythonPath: 'wrong', CLASSPATH: 'wrong', JAVA_TOOL_OPTIONS: '-wrong', SystemRoot: 'C:\\Windows' });
    assert.equal(env.Path, undefined);
    assert.equal(env.PYTHONHOME, undefined);
    assert.equal(env.PythonPath, undefined);
    assert.equal(env.CLASSPATH, undefined);
    assert.equal(env.JAVA_TOOL_OPTIONS, undefined);
    assert.ok(env.PATH.endsWith(';system-tools'));
    assert.equal(env.PYTHONNOUSERSITE, '1');
});

test('valid complete bundles resolve only for the requested CPU', () => {
    const fs = require('fs');
    const os = require('os');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-select-'));
    try {
        for (const arch of ['ia32', 'x64']) {
            for (const file of ['c/bin/gcc.exe', 'c/bin/g++.exe', 'python/python.exe', 'java/bin/java.exe', 'java/bin/javac.exe']) {
                const dest = path.join(root, 'runtimes', arch, file);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.writeFileSync(dest, '');
            }
            assert.equal(selectRuntime(root, 'win32', arch), path.join(root, 'runtimes', arch));
        }
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
