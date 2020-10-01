# SB-Babel-CLI

A smarter babel-cli. Supports caching and removing extra files from output directories.

Also supports running apps like nodemon, with `--execute/-x`, `--execute-delay`

**Note:** For Babel 6, see [0.1.x branch](https://github.com/steelbrain/babel-cli/tree/0.1.x)

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
  --write-flow-sources                Write .flow files that are symlinked to source files. Helps 
                                      with monorepos in some cases
  --source-maps                       Outputs source maps (Node 12+)
  --disable-cache                     Force recompile all files ignoring cache
  --keep-extra-files                  Do NOT delete extra files in the output directory
  -o, --output-directory <directory>  Output directory to write transpiled files to
  -x, --execute <entryFile>           Relative path of file to execute (only supported in watcher mode)
  --execute-delay <delay>             Delay in ms to in between restarts of executed file
  --typescript                        Enables typescript support by processing .ts and .tsx files
  -h, --help                          output usage information

Arguments after -- will be passed as-are to the program specified in -x flag
Supported NodeJS CLI flags:  --debug-port, --inspect-port, --inspect, --inspect-brk, --inspect-publish-uid
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
