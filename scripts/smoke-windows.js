// Uses only the bundled tools. Run on Windows with Node matching the requested CPU.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { selectRuntime, planRun, runtimeEnv, powershellCommand } = require('../src/runner');
const { validateBundle } = require('./validate-bundle');
const arch = process.argv[2] || process.arch;
if (process.platform !== 'win32') throw new Error('Native smoke tests require Windows.');
assert.equal(process.arch, arch, 'Use a Node executable matching the bundle architecture');
const runtime = selectRuntime(path.resolve(__dirname, '..'), 'win32', arch);
validateBundle(runtime, arch);
const systemRoot = process.env.SystemRoot || 'C:\\Windows';
const inherited = { ...process.env };
for (const key of Object.keys(inherited)) if (key.toLowerCase() === 'path') delete inherited[key];
const env = runtimeEnv(runtime, { ...inherited, PATH: [path.join(systemRoot, 'System32'), systemRoot].join(';') });
const work = fs.mkdtempSync(path.join(os.tmpdir(), "offline runner's & tests "));
function run(language, name, source, input = '') {
    const file = path.join(work, name);
    fs.writeFileSync(file, source);
    const plan = planRun(runtime, language, file, work, source);
    if (language === 'c' || language === 'cpp') plan.compile.args.push(`-DEXPECTED_POINTER_BYTES=${arch === 'ia32' ? 4 : 8}`);
    const opts = { cwd: work, env, encoding: 'utf8', timeout: 120000, windowsHide: true };
    if (plan.compile) execFileSync(plan.compile.file, plan.compile.args, opts);
    return execFileSync(plan.run.file, plan.run.args, { ...opts, input }).trim();
}
try {
    const shellScript = path.join(work, "shell's & check.py");
    fs.writeFileSync(shellScript, 'print(42)');
    const shellOutput = execFileSync(path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', powershellCommand(path.join(runtime, 'python', 'python.exe'), [shellScript])],
        { cwd: work, env, encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(shellOutput.trim(), '42');
    assert.equal(run('c', 'hello & world.c', '#include <stdio.h>\nint main(void){int n; scanf("%d", &n); printf("%d", n+1); return 0;}', '41\n'), '42');
    assert.equal(run('cpp', 'hello world.cpp', '#include <iostream>\n#include <vector>\nint main(){std::vector<int> v{20,22};std::cout<<v[0]+v[1];}'), '42');
    assert.equal(run('java', 'Hello.java', '/* package ignored; */\npackage demo;\npublic class Hello {public static void main(String[] args) {java.util.Scanner in=new java.util.Scanner(System.in);System.out.print(in.nextInt()+1);}}', '41\n'), '42');
    assert.throws(() => run('c', 'broken.c', 'this is not C;'));
    assert.throws(() => run('java', 'Broken.java', 'public class Broken { syntax error }'));
    for (const [language, fixture, expected] of [
        ['c', 'edge.c', 'C edges OK'], ['cpp', 'edge.cpp', 'C++ edges OK'],
        ['java', 'Edge.java', 'Java edges OK'], ['python', 'edge.py', 'Python edges OK']
    ]) {
        const source = fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', fixture), 'utf8');
        assert.equal(run(language, fixture, source, 'spaces and symbols & 42\n'), expected);
        console.log(`PASS: ${language} edge-case fixture`);
    }
    for (const [language, name, source] of [
        ['c', 'Exit.c', 'int main(void){return 7;}'],
        ['cpp', 'Exit.cpp', 'int main(){return 7;}'],
        ['java', 'Exit.java', 'public class Exit {public static void main(String[] a){System.exit(7);}}'],
        ['python', 'Exit.py', 'raise SystemExit(7)']
    ]) assert.throws(() => run(language, name, source), error => error.status === 7);
    assert.throws(() => run('cpp', 'bad.cpp', '#include <definitely_missing_header.h>'), error => error.status !== 0);
    assert.throws(() => run('python', 'bad.py', 'def broken('), error => error.status !== 0);
    // Exercise a bounded timeout with the actual bundled interpreter.
    assert.throws(() => execFileSync(path.join(runtime, 'python', 'python.exe'), ['-c', 'while True: pass'],
        { env, cwd: work, timeout: 500, windowsHide: true }), error => error.code === 'ETIMEDOUT');
    const scientific = arch === 'x64' ? `
import scipy.linalg
assert round(float(scipy.linalg.det([[1,2],[3,4]]))) == -2
from sklearn.linear_model import LinearRegression
assert round(float(LinearRegression().fit([[0],[1]], [0,2]).predict([[2]])[0])) == 4
` : '';
    assert.equal(run('python', 'library checks.py', `
import sys, struct, json, sqlite3, ssl, ctypes
assert struct.calcsize('P') * 8 == ${arch === 'ia32' ? 32 : 64}
import numpy as np, pandas as pd
assert int(np.dot([1,2],[3,4])) == 11
assert int(pd.DataFrame({'a':[20,22]}).a.sum()) == 42
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
plt.plot([1,2]); plt.savefig('plot.png'); plt.close()
from PIL import Image
assert Image.open('plot.png').size[0] > 0
import requests, sympy, pytest, yaml, bs4, openpyxl, flask
assert requests.Request('GET','https://example.com').prepare().method == 'GET'
assert sympy.expand((sympy.Symbol('x')+1)**2).subs('x', 1) == 4
assert yaml.safe_load('a: 42')['a'] == 42
assert bs4.BeautifulSoup('<p>42</p>', 'html.parser').p.text == '42'
book=openpyxl.Workbook(); book.active['A1']=42; book.save('book.xlsx')
assert openpyxl.load_workbook('book.xlsx').active['A1'].value == 42
app=flask.Flask(__name__)
app.add_url_rule('/', 'home', lambda: '42')
assert app.test_client().get('/').data == b'42'
assert pytest.main(['--version']) == 0
${scientific}
print('libraries OK')
`).endsWith('libraries OK'), true);
    execFileSync(path.join(runtime, 'python', 'python.exe'), ['-m', 'pip', 'check'], { cwd: work, env, stdio: 'inherit' });
    console.log(`PASS: Windows ${arch}: C, C++, Java, Python, libraries, stdin, invalid code and special-character paths.`);
} finally { fs.rmSync(work, { recursive: true, force: true }); }
