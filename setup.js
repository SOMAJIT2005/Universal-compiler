// Release-builder only. Nothing is downloaded when a user installs or runs the VSIX.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { execFileSync } = require('child_process');
const AdmZip = require('adm-zip');
const axios = require('axios');
const sources = require('./toolchains.json');
const root = __dirname;

function sha256(file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(file);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

async function archive(source) {
    const cache = path.join(root, '.cache');
    fs.mkdirSync(cache, { recursive: true });
    const file = path.join(cache, path.basename(source.url));
    if (!fs.existsSync(file)) {
        console.log(`Downloading ${path.basename(file)}`);
        const response = await axios.get(source.url, { responseType: 'stream', timeout: 120000 });
        const partial = `${file}.partial`;
        try {
            await pipeline(response.data, fs.createWriteStream(partial));
            fs.renameSync(partial, file);
        } finally { fs.rmSync(partial, { force: true }); }
    }
    if (await sha256(file) !== source.sha256) throw new Error(`Checksum mismatch: ${file}. Remove it and rebuild.`);
    return file;
}

function extract(file, destination) {
    const zip = new AdmZip(file);
    for (const entry of zip.getEntries()) {
        const name = entry.entryName.replace(/\\/g, '/');
        if (name.startsWith('/') || name.split('/').includes('..') || /^[A-Za-z]:/.test(name)) throw new Error('Unsafe archive entry');
    }
    zip.extractAllTo(destination, true);
}

async function build(arch, bundleOnly = false) {
    if (!sources[arch]) throw new Error('Use --arch=ia32 or --arch=x64. ARM64 is not bundled.');
    const runtime = path.join(root, 'runtimes', arch);
    const staging = path.join(root, '.build', arch);
    fs.rmSync(runtime, { recursive: true, force: true });
    fs.mkdirSync(runtime, { recursive: true });
    for (const [kind, source] of Object.entries(sources[arch])) {
        const extracted = path.join(staging, 'extract');
        fs.rmSync(extracted, { recursive: true, force: true });
        extract(await archive(source), extracted);
        const folder = kind === 'python' ? 'tools' : fs.readdirSync(extracted)[0];
        fs.renameSync(path.join(extracted, folder), path.join(runtime, kind));
        fs.rmSync(extracted, { recursive: true, force: true });
    }
    const builderPython = process.env.BUILDER_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
    execFileSync(builderPython, ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-compile',
        '--only-binary=:all:', '--require-hashes', '--platform', arch === 'ia32' ? 'win32' : 'win_amd64',
        '--python-version', '3.11', '--implementation', 'cp', '--abi', 'cp311',
        '--target', path.join(runtime, 'python', 'Lib', 'site-packages'),
        '-r', path.join(root, 'requirements', `${arch}.txt`)], { stdio: 'inherit' });
    // Records exactly what went into the runtime; included alongside upstream licenses.
    fs.copyFileSync(path.join(root, 'requirements', `${arch}.txt`), path.join(runtime, 'python-packages.txt'));
    fs.writeFileSync(path.join(runtime, 'sources.json'), JSON.stringify(sources[arch], null, 2));
    const { validateBundle } = require('./scripts/validate-bundle');
    validateBundle(runtime, arch);
    if (process.platform === 'win32') {
        execFileSync(process.execPath, [path.join(root, 'scripts', 'smoke-windows.js'), arch], { stdio: 'inherit' });
    }
    if (bundleOnly) return;
    const extension = path.join(staging, 'extension');
    fs.rmSync(extension, { recursive: true, force: true });
    fs.mkdirSync(extension, { recursive: true });
    for (const file of ['package.json', 'README.md', 'THIRD_PARTY.md', 'CHANGELOG.md']) fs.copyFileSync(path.join(root, file), path.join(extension, file));
    fs.cpSync(path.join(root, 'docs'), path.join(extension, 'docs'), { recursive: true });
    fs.cpSync(path.join(root, 'src'), path.join(extension, 'src'), { recursive: true });
    fs.cpSync(runtime, path.join(extension, 'runtimes', arch), { recursive: true });
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    const manifest = require('./package.json');
    const args = [require.resolve('@vscode/vsce/vsce'), 'package', '--no-dependencies', '--allow-missing-repository', '--skip-license',
        '--out', path.join(root, 'dist', `${manifest.name}-${manifest.version}-win32-${arch}.vsix`)];
    // VSCE has no ia32 target anymore. The legacy VSIX is untagged and guarded at runtime.
    if (arch === 'x64') args.push('--target', 'win32-x64');
    execFileSync(process.execPath, args, { cwd: extension, stdio: 'inherit' });
}

if (require.main === module) {
    const arch = process.argv.find(arg => arg.startsWith('--arch='))?.split('=')[1];
    build(arch, process.argv.includes('--bundle-only')).catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
module.exports = { build, sha256 };
