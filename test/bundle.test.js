const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { machine, validateBundle } = require('../scripts/validate-bundle');
const { sha256 } = require('../setup');

function pe(cpu) {
    const bytes = Buffer.alloc(72);
    bytes.write('MZ'); bytes.writeUInt32LE(64, 60);
    bytes.writeUInt32LE(0x4550, 64); bytes.writeUInt16LE(cpu, 68);
    return bytes;
}
test('bundle validation catches wrong launchers, native libraries, and Fortran components', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-pe-'));
    try {
        for (const name of ['c/bin/gcc.exe', 'c/bin/g++.exe', 'java/bin/java.exe', 'java/bin/javac.exe', 'python/python.exe']) {
            const dest = path.join(root, name);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.writeFileSync(dest, pe(0x8664));
        }
        assert.equal(machine(path.join(root, 'c/bin/gcc.exe')), 0x8664);
        validateBundle(root, 'x64');
        assert.throws(() => validateBundle(root, 'ia32'), /Wrong architecture/);
        const native = path.join(root, 'python/native.pyd');
        fs.writeFileSync(native, pe(0x14c));
        assert.throws(() => validateBundle(root, 'x64'), /native library architecture/);
        fs.unlinkSync(native);
        fs.writeFileSync(path.join(root, 'c/bin/gfortran.exe'), pe(0x8664));
        assert.throws(() => validateBundle(root, 'x64'), /Fortran component/);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('archive hashing detects changes to downloaded bytes', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-sha-'));
    try {
        const file = path.join(root, 'archive.zip');
        fs.writeFileSync(file, 'abc');
        assert.equal(await sha256(file), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        fs.appendFileSync(file, 'changed');
        assert.notEqual(await sha256(file), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
