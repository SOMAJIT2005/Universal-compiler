Windows offline C/C++, Python, and Java 8 runner by Somajit Deb, undergraduate student of CSE at Khulna University, Bangladesh.

Download `win32-x64.vsix` for Windows x64 or `win32-ia32.vsix` for legacy Windows x86. Install through VS Code's **Install from VSIX** command. Bundled tools and common Python libraries require no additional compiler installation or runtime download. Fortran is excluded.

This release is gated on Windows x64 and WOW64 x86 tests covering real compilation/execution, integer boundaries, collections, exceptions, Unicode, binary file I/O, stdin/EOF, nonzero exits, invalid source, timeouts, PowerShell quoting, and Python library operations. SHA-256 checksums are included.

Limitations: x86 requires legacy 32-bit VS Code 1.80–1.83.1. x86 CI uses WOW64, not a native 32-bit Windows OS. Native ARM64 and manual editor interaction are not certified. SciPy/scikit-learn are x64-only; Java supports single-file Java 8 programs. No test suite can certify every possible source program.

To roll back, uninstall the extension and install an earlier compatible release VSIX.
