# SB-Babel-CLI

A smarter babel-cli. Supports caching and removing extra files from output directories.

Also supports running apps like nodemon, with `--execute/-x`, `--execute-delay`

**Note:** For Babel 6, see [0.1.x branch](https://github.com/steelbrain/babel-cli/tree/0.1.x)
**Note:** For v3, see [v3 branch](https://github.com/steelbrain/babel-cli/tree/v3)

### Installation

```
npm install --save-dev sb-babel-cli
# OR Use with npx directory:
npx sb-babel-cli [options] <source directory>
```

### Usage

```
Usage: cli [options] <source directory>

A smarter babel-cli

Options:
  -V, --version                       output the version number
  -w, --watch                         Watch files for changes
  --root <directory>                  Root directory for babel. This is where presets are resolved from
  --ignored <list>                    Ignored files and directories that match the given globs
  --ignored-for-restart <list>        These files are transpiled, but do not cause restart
  --write-flow-sources                Write .flow files that are symlinked to source files. Helps with monorepos in
                                      some cases
  --source-maps [true|false|inline]   Generate source maps for transpiled files
  --disable-cache                     Force retranspile all files ignoring cache
  --keep-extra-files                  Do NOT delete extra files in the output directory
  -o, --output-directory <directory>  Output directory to write transpiled files to
  -x, --execute <entryFile>           Relative path of file to execute (only supported in watcher mode)
  --execute-delay <delay>             Delay in ms in between restarts of executed file (defaults to 1000ms)
  --typescript                        Enables typescript support by processing .ts and .tsx files
  -h, --help                          display help for command

Arguments after -- will be passed as-are to the program specified in -x flag
Supported NodeJS CLI flags:  --debug-port, --inspect-port, --inspect, --inspect-brk, --inspect-publish-uid, --enable-source-maps
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
