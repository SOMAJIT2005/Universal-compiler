# Verification record — 2026-10-17 (Asia/Dhaka)

Both Windows architecture jobs passed in [GitHub Actions run 38948535812](https://github.com/SOMAJIT2005/Universal-compiler/actions/runs/38948535812), for commit `66b5793`.

| Environment | Result |
| --- | --- |
| Windows Server 2022 x64, native x64 tools | Passed; VSIX built and uploaded |
| Windows Server 2022 x64, x86 tools under WOW64 | Passed; VSIX built and uploaded |
| Native Windows x86 OS | Not tested |
| Real VS Code editor interaction | Not tested; VS Code API unit tests use stubs |
| Native Windows ARM64 | Not supported/tested |

## Executed checks

- All 15 Node unit tests passed on both Windows jobs and locally on Linux: architecture selection, missing bundles, command planning, quoting, environment isolation, workspace trust, cancelled saves, compiler failure handling, and temporary-output cleanup.
- Both jobs compiled and ran real bundled C, C++, and Java programs and ran the bundled Python interpreter, with system toolchain directories removed from PATH.
- Edge-case fixtures checked CPU pointer width, defined unsigned wraparound, integer limits, Java BigInteger/Python arbitrary precision, large collections, templates, exceptions, Unicode text, binary file round trips, SQLite parameter binding, stdin, and EOF.
- Additional checks exercised exit code 7 in all four languages, invalid source/missing headers, a bounded infinite-loop timeout, and actual PowerShell invocation of paths containing spaces, apostrophes, and ampersands. Diagnostics from intentionally invalid programs are expected test output.
- Python performed real NumPy/pandas operations, Matplotlib image generation, Pillow image loading, Requests preparation, SymPy algebra, pytest startup, YAML/HTML parsing, Excel round trips, and Flask test-client requests. x64 additionally exercised SciPy and scikit-learn. Both `pip check` runs reported no broken requirements.
- Both bundles passed pinned archive/wheel hashes, PE architecture checks on launchers and DLL/PYD files, and checks excluding Fortran compiler/runtime components.
- Both jobs created full architecture-specific VSIX artifacts only after executable tests passed.

An initial x86 CI run failed before compiler testing because VSCE signing dependencies do not support 32-bit Node build hosts. CI now packages under x64 Node.js 22 and executes x86 tests through a separate x86 Node.js 22 process.

These tests establish that the bundled tools work for the covered cases. They cannot prove every possible program or Python library works perfectly. A native Windows x86 VM and clean-machine manual VS Code installation, Play-button, input, error-display, and cleanup checks remain necessary to certify those environments. Release publication is gated on both Windows jobs passing again for the release tag.
