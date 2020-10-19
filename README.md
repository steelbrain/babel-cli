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
  --root <directory>                  Root directory for compilation; where presets and CLI config is resolved from
                                      (defaults to cwd)
  --ignored <glob>                    Ignored files and directories that match the given glob
  --ignored-for-restart <glob>        These files are transpiled, but do not cause restart
  --source-maps [true|false|inline]   Generate source maps for transpiled files
  --reset-cache                       Retranspile all files ignoring cache
  --keep-extra-files                  Do NOT delete extra files in the output directory
  -o, --output-directory <directory>  Output directory to write transpiled files to
  -x, --execute <entryFile>           Relative path of file to execute (only supported in watcher mode)
  --execute-delay <delay>             Delay in ms in between restarts of executed file (defaults to 1000ms)
  --extensions <exts>                 Comma spearated extensions to process through the CLI (defaults to .js)
  --no-load-config                    Disables loading of "sb-config-file" from package.json (in --root)
  --print-config                      Print the config being used (for debugging only)
  --debug-port <arg>                  Passthrough arg for Node.js runtime for programs executed through -x
  --inspect-port <arg>                Passthrough arg for Node.js runtime for programs executed through -x
  --inspect                           Passthrough arg for Node.js runtime for programs executed through -x
  --inspect-brk                       Passthrough arg for Node.js runtime for programs executed through -x
  --inspect-publish-uid <arg>         Passthrough arg for Node.js runtime for programs executed through -x
  --enable-source-maps                Passthrough arg for Node.js runtime for programs executed through -x
  -h, --help                          display help for command

Arguments after -- will be passed as-are to programs executed through -x
```

### Configuration

In addition to specifying options in CLI, you can also add them to your `package.json`s (located through `--root` or cwd)
with the key `sb-babel-cli`. Here are the supported options

```typescript
interface Config {
  outputDirectory: string

  watch: boolean
  ignored: string
  ignoredForRestart: string
  sourceMaps: boolean | 'inline'
  resetCache: boolean
  keepExtraFiles: boolean
  execute: string
  executeDelay: number
  extensions: string[]
  printConfig: boolean
  nodeArgs: string[]
  programArgs: string[]
}
```

For example, for Typescript you can use the following configuration

```json5
// package.json
{
  "name": "...",
  // ...
  "sb-babel-cli": {
    "extensions": [".js", ".ts", ".tsx"]
  }
}
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
