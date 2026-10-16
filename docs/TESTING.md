# Verification record — 2026-10-17 (Asia/Dhaka)

Executed in the Linux cloud workspace with Node.js 24.19.0. No Windows host, Wine, native x86 Windows VM, or VS Code extension host was available.

## Passed locally

- `npm test`: 15 tests passed. Tests cover runtime selection, mismatched/missing bundles, separate GCC/G++ commands, Python and packaged Java launch plans, Fortran rejection, PowerShell literal quoting, environment isolation, workspace trust, cancelled saves, compiler failures, and terminal-close cleanup. VS Code API interactions are stubbed; these tests do not constitute a real editor test.
- Both `node setup.js --arch=ia32` and `node setup.js --arch=x64` completed and generated full VSIX packages.
- All six toolchain archive hashes matched the checked-in SHA-256 values. Package installation required hash-locked Windows wheels and prohibited source builds.
- Both bundles passed PE architecture checks on the compiler/interpreter launchers and every bundled DLL/PYD. No Fortran compiler executable or libgfortran runtime was found.
- Installed Python dependency metadata was checked using Windows/CPython 3.11 markers: 41 installed distributions on ia32 and 46 on x64; no missing/incompatible declared dependencies. This is a metadata check, not an import/execution test.
- JavaScript syntax checks and `git diff --check` passed.

## Pending Windows validation

The checked-in `.github/workflows/windows.yml` has not been run in this session. It tests x64 tools and x86 tools under WOW64 on Windows x64 with matching Node architectures. `scripts/smoke-windows.js` checks real C/C++/Java compilation and execution, Python imports and library operations, PowerShell invocation, stdin, invalid code, DLL loading, and special-character paths. It removes system toolchain directories from PATH. A successful native Windows build runs those tests before packaging.

A real Windows x86 OS still needs a VM/manual run; WOW64 does not certify a 32-bit Windows installation. Also manually install the matching VSIX in a clean compatible VS Code and exercise the editor Play button, save flow, input, compilation-error display, and terminal cleanup. Native ARM64 is not supported or validated. No claim of support for every Python library is made.

The artifacts produced in Linux are candidate builds, not Windows-certified releases. They remain in ignored `dist/`; old VSIX files at the repository root are unchanged.
