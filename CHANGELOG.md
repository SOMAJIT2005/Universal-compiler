# Changes

## 1.1.0

- Bundle separate Windows x86 and x64 C/C++, Python, and Java toolchains for offline use.
- Add Python and Java execution to the Play command; use GCC for C files.
- Use the non-Fortran compiler distributions and reject Fortran compiler/runtime files during builds.
- Pin archive and Python wheel hashes; fail packaging on missing or mismatched runtimes.
- Handle paths containing spaces and shell metacharacters; require workspace trust.
- Add Windows smoke checks and document legacy x86 and Python-library limits.

- Add developer introduction, detailed compiler edge cases, and Windows-gated GitHub Release downloads.
