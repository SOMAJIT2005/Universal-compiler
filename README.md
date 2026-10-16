# Offline Code Runner

A Windows VS Code extension for running **C, C++, Python, and Java 8** with bundled tools. No separate compiler, Python, or JDK installation is needed. Fortran is not included.

**Developer:** Somajit Deb — undergraduate student of Computer Science and Engineering (CSE) at Khulna University, Bangladesh.

## Install and run

1. Download the matching VSIX from [GitHub Releases](https://github.com/SOMAJIT2005/Universal-compiler/releases/latest).
2. In VS Code, select **Extensions → ⋯ → Install from VSIX**.
3. Open a trusted workspace, save a supported source file, and click **Play**.

| Windows bundle | Compatibility |
| --- | --- |
| **x64** | Windows 10+ with x64 VS Code |
| **x86 / ia32** | Windows 10 32-bit with legacy VS Code 1.80–1.83.1 |

Both bundles include NumPy, pandas, Matplotlib, Requests, Pillow, SymPy, pytest, PyYAML, Beautiful Soup, openpyxl, and Flask. SciPy and scikit-learn are x64-only. Native ARM64, Tkinter, GPU libraries, and Maven/Gradle projects are not supported.

## Development

```
npm ci
npm test
npm run build-product -- --arch=x64
npm run build-product -- --arch=ia32
```

Building requires Node.js 22+ (x64) and Python with pip. Release builds run compiler/library edge cases on Windows before publishing both VSIX files and SHA-256 checksums. x86 CI runs under WOW64; a native 32-bit Windows VM and manual VS Code checks are still needed for full platform validation. Passing tests cannot guarantee every possible program works perfectly.

See [compatibility and build details](docs/COMPATIBILITY.md), [test status](docs/TESTING.md), and [third-party notices](THIRD_PARTY.md).
