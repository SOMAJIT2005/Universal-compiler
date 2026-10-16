# Bundled third-party software

Release bundles retain the license/notice/source-information files supplied by each upstream distribution. Python wheels retain their `.dist-info` license files. The sources and exact archive hashes are included in `runtimes/<architecture>/sources.json`.

- [w64devkit 1.20.0](https://github.com/skeeto/w64devkit/releases/tag/v1.20.0): GCC, MinGW-w64, binutils, and supporting tools under their respective licenses, including GPL components. The non-Fortran archives are used. Distribution includes upstream source acquisition information in `src/`; see upstream licensing/source instructions when redistributing.
- [CPython 3.11.9 NuGet packages](https://www.nuget.org/packages/python/3.11.9): PSF license and bundled third-party notices in `python/LICENSE.txt`.
- [Eclipse Temurin 8u472-b08](https://github.com/adoptium/temurin8-binaries/releases/tag/jdk8u472-b08): OpenJDK GPLv2 with the Classpath Exception, plus upstream notices and corresponding source references.
- Python packages: exact versions/hashes appear in `python-packages.txt`; see each distribution's installed metadata and license files.

Review upstream redistribution and corresponding-source obligations before publishing a release. This extension's source does not assign a new license to the bundled third-party tools.
