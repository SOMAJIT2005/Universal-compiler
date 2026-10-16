const fs = require('fs');
const path = require('path');

function selectRuntime(root, platform = process.platform, arch = process.arch) {
    if (platform !== 'win32') throw new Error('This extension supports Windows only.');
    if (!['ia32', 'x64'].includes(arch)) throw new Error(`Unsupported Windows architecture: ${arch}. Use x64 VS Code under emulation on ARM64; native ARM64 is not bundled.`);
    const runtime = path.join(root, 'runtimes', arch);
    for (const file of ['c/bin/gcc.exe', 'c/bin/g++.exe', 'python/python.exe', 'java/bin/javac.exe', 'java/bin/java.exe']) {
        if (!fs.existsSync(path.join(runtime, file))) throw new Error(`Missing ${arch} runtime bundle. Install the matching complete VSIX.`);
    }
    return runtime;
}

function planRun(runtime, language, source, work, text = '') {
    const cbin = path.join(runtime, 'c', 'bin');
    if (language === 'c' || language === 'cpp') {
        const output = path.join(work, 'program.exe');
        return {
            compile: { file: path.join(cbin, language === 'c' ? 'gcc.exe' : 'g++.exe'), args: [source, '-o', output] },
            run: { file: output, args: [] }
        };
    }
    if (language === 'python') return { run: { file: path.join(runtime, 'python', 'python.exe'), args: ['-u', source] } };
    if (language === 'java') {
        const stripped = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '');
        const pkg = stripped.match(/^\s*package\s+([\w.]+)\s*;/m);
        const className = (pkg ? `${pkg[1]}.` : '') + path.parse(source).name;
        return {
            compile: { file: path.join(runtime, 'java', 'bin', 'javac.exe'), args: ['-encoding', 'UTF-8', '-d', work, source] },
            run: { file: path.join(runtime, 'java', 'bin', 'java.exe'), args: ['-cp', work, className] }
        };
    }
    throw new Error('Unsupported language. Open a C, C++, Python, or Java file.');
}

function runtimeEnv(runtime, inherited = process.env) {
    const env = { ...inherited };
    // Windows environment names are case-insensitive; duplicate Path/PATH can drop our toolchain.
    for (const key of Object.keys(env)) {
        if (['path', 'pythonhome', 'pythonpath', 'java_home', 'classpath', 'java_tool_options', '_java_options', 'jdk_java_options'].includes(key.toLowerCase())) delete env[key];
    }
    const inheritedPath = Object.entries(inherited).find(([key]) => key.toLowerCase() === 'path');
    env.PATH = [path.join(runtime, 'c', 'bin'), path.join(runtime, 'python'), path.join(runtime, 'java', 'bin'), inheritedPath?.[1] || ''].join(';');
    env.PYTHONNOUSERSITE = '1';
    env.JAVA_HOME = path.join(runtime, 'java');
    return env;
}

function powershellCommand(file, args) {
    const quote = value => `'${value.replace(/'/g, "''")}'`;
    return `& ${[file, ...args].map(quote).join(' ')}`;
}

module.exports = { selectRuntime, planRun, runtimeEnv, powershellCommand };
