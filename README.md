# SB-Babel-CLI

A smarter babel-cli. Supports caching and removing extra files from output directories.

### Installation

```
npm install --save-dev sb-babel-cli
# OR
npm install -g sb-babel-cli
# OR Use with npx directory:
npx sb-babel-cli [options] <source directory>
```

### Usage

```
Usage: sb-babel-cli [options] <source directory>

A smarter babel-cli


Options:

  -V, --version                       output the version number
  -w, --watch                         Watch files for changes
  --ignored <list>                    Ignored files and directories that match the given globs
  --write-flow-sources                Write .flow files that are symlinked to source files. Helps with monorepos in some cases
  --disable-cache                     Force recompile all files ignoring cache
  --keep-extra-files                  Do NOT delete extra files in the output directory
  -o, --output-directory <directory>  Output directory to write transpiled files to
  -h, --help                          output usage information
```

### License

This project is licensed under the terms of the MIT License. See the LICENSE file for more info.
