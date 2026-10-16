# Offline Code Runner for Windows

Run a saved C, C++, Python, or Java file using the editor's Play button or **Run C/C++/Python/Java Code** in the Command Palette. Programs run in an interactive PowerShell terminal with their source folder as the working directory. Trust the workspace first. Close the terminal when finished to remove temporary compiled output.

Each release VSIX contains the compiler/interpreters and libraries. End users need no compiler, Python, Java, pip installation, administrator privileges, or runtime downloads. Building a release does require Internet access, Node.js, and a builder Python with pip.

## Windows compatibility

| Bundle | Tool architecture | VS Code |
| --- | --- | --- |
| `win32-x64.vsix` | native x64 | Windows x64, compatible VS Code 1.80+ |
| `win32-ia32.vsix` | native 32-bit x86 | Windows x86 with legacy 32-bit VS Code 1.80–1.83 (last release: 1.83.1) |

Use Windows 10 or newer. Modern VS Code no longer ships x86 builds; the extension cannot restore that support. The legacy x86 VSIX is untagged because VSCE no longer accepts an ia32 target; it rejects mismatched runtimes when invoked. It is intended for manual installation using **Extensions → Install from VSIX**. x86 binaries also run under WOW64 on Windows x64, using 32-bit VS Code. Native Windows ARM64 is not bundled or validated; using x64 VS Code under Windows ARM emulation is experimental and untested. Linux and macOS execution is intentionally disabled.

Bundled tools: w64devkit 1.20.0 C/C++ (non-Fortran distribution), CPython 3.11.9, and Eclipse Temurin OpenJDK 8u472-b08. Java supports Java 8 syntax/API and a single source file whose main class matches the filename, including a package declaration. Maven/Gradle projects, external JAR dependencies, Java modules, and newer Java language versions are outside this runner's scope. C/C++ uses the bundled GCC defaults and standard libraries.

## Python libraries

Both bundles include NumPy, pandas, Matplotlib, Requests, Pillow, SymPy, pytest, PyYAML, Beautiful Soup, openpyxl, and Flask, plus their dependencies and pip. The x64 bundle also includes SciPy and scikit-learn. Package versions and wheel hashes are recorded in `requirements/ia32.txt` and `requirements/x64.txt`, and copied into each bundle. NumPy/pandas/Matplotlib use compatible pinned versions for the x86 ecosystem. Standard-library modules such as JSON, SQLite, SSL, and ctypes are included; the NuGet Python distribution does not include Tcl/Tk, so Tkinter GUI support is not provided.

“All Python libraries” cannot be guaranteed: packages can require external services, GPU drivers, system libraries, or architecture-specific binaries. SciPy and scikit-learn are omitted on x86 because compatible CPython 3.11 Windows wheels are unavailable. TensorFlow/PyTorch/GPU stacks are not bundled. Additional packages are not installed automatically. Use packages with compatible prebuilt wheels to avoid requiring a compiler; the build forbids source distributions.

## Build

```
npm ci
npm test
npm run build-product -- --arch=x64
npm run build-product -- --arch=ia32
```

Set `BUILDER_PYTHON` to the builder Python executable if necessary. Downloads are pinned by SHA-256 in `toolchains.json`; Python dependencies use hash-locked binary wheels. The build checks PE architecture of launchers and native libraries, rejects Fortran executables/runtimes, and fails with a nonzero exit status on any error. Each package includes only its matching architecture and upstream license files. Artifacts are written to `dist/`. They are large because full offline runtimes and scientific libraries are included.

The builder can prepare and package Windows files on Linux. Native execution checks require Windows and a Node executable matching the selected architecture. On Windows the build runs these checks before packaging:

```
npm run test:windows -- x64
npm run test:windows -- ia32
```

The Windows CI matrix uses x86 and x64 Node on a Windows x64 host. It compiles/runs C, C++, and Java, exercises Python library operations, tests stdin and filenames with spaces/apostrophes/ampersands, verifies failure on invalid source, and checks Python dependencies. This proves WOW64 execution of x86 tools, not a native 32-bit Windows installation. Before distribution, also manually install each VSIX in the matching VS Code on a clean Windows machine/VM without other toolchains and verify Play, terminal input, error reporting, and terminal-close cleanup. A native Windows x86 VM is still needed to certify 32-bit Windows itself.

## Local verification status

See [test status](TESTING.md) for the checks actually performed for this change. A generated VSIX alone is not evidence of successful native Windows execution.
