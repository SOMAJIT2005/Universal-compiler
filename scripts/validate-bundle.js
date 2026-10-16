const fs = require('fs');
const path = require('path');

function machine(file) {
    const fd = fs.openSync(file, 'r');
    try {
        const dos = Buffer.alloc(64);
        fs.readSync(fd, dos, 0, 64, 0);
        if (dos.toString('ascii', 0, 2) !== 'MZ') throw new Error(`Not a PE executable: ${file}`);
        const pe = Buffer.alloc(6);
        fs.readSync(fd, pe, 0, 6, dos.readUInt32LE(60));
        if (pe.readUInt32LE(0) !== 0x4550) throw new Error(`Invalid PE signature: ${file}`);
        return pe.readUInt16LE(4);
    } finally { fs.closeSync(fd); }
}
function validateBundle(runtime, arch) {
    const expected = { ia32: 0x14c, x64: 0x8664 }[arch];
    if (!expected) throw new Error('Unsupported architecture');
    for (const item of ['c/bin/gcc.exe', 'c/bin/g++.exe', 'python/python.exe', 'java/bin/javac.exe', 'java/bin/java.exe']) {
        if (machine(path.join(runtime, item)) !== expected) throw new Error(`Wrong architecture: ${item}`);
    }
    // Check native libraries too; a correct launcher can still hide a mismatched DLL.
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(file);
            else {
                if (/^(.*-)?gfortran(?:\.exe)?$|^f951\.exe$|^libgfortran/i.test(entry.name)) throw new Error(`Fortran component found: ${file}`);
                if (/\.(dll|pyd)$/i.test(entry.name) && machine(file) !== expected) throw new Error(`Wrong native library architecture: ${file}`);
            }
        }
    }
    walk(runtime);
    console.log(`Validated ${arch} PE architecture and absence of Fortran compiler/runtime.`);
}
if (require.main === module) {
    try { validateBundle(path.resolve(__dirname, '..', 'runtimes', process.argv[2]), process.argv[2]); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { machine, validateBundle };
