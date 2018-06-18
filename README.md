# SB-Babel-CLI

A smarter babel-cli. Supports caching and removing extra files from output directories.

Also supports running apps like nodemon, with `--execute/-x`, `--execute-delay`

**Note:** For Babel 7, see [master branch](https://github.com/steelbrain/babel-cli/tree/master)

### Installation

```
npm install --save-dev sb-babel-cli
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
  -x, --execute <entryFile>           Relative path of file to execute (only supported in watcher mode)
  --execute-delay <delay>             Delay in ms to in between restarts of executed file
  -h, --help                          output usage information
```

### Examples

```
# To compile contents of src to lib directory
$ sb-babel-cli src -o lib
# To compile contents of src to lib directory and execute lib/server
$ sb-babel-cli src -o lib -x lib/server
```

### License

This project is licensed under the terms of the MIT License. See the LICENSE file for more info.
