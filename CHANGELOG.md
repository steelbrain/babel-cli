### 5.0.0

- CACHE BREAKING: Use content hash (SHA1) instead of timestamps for cache. This should give you cache persistence in CI environments.

### 4.1.0

- Improve restart behavior - Restarts are no longer eager, and only occur when no further files are being changed
  in an executeDelay period.

### 4.0.1

- Fix line endings being `\r\n` instead of `\n` in compiled output, breaking direct bin invocation

### 4.0.0

- BREAKING: Remove `--write-flow-sources`
- BREAKING: Rename `--disable-cache` to `--reset-cache`
- BREAKING: `--ignored` now expects one glob, previous implementation could break globs that used commas
- BREAKING: Added a `@babel/core` peer dependency
- BREAKING: `process.exit()` on running programs will no longer be called with `SIGHUP` but with `SIGINT`
  This fixes Windows compatibility and shouldn't have any noticable behavior except in most odd cases.
- Added `--extensions` to specify which extensions to process
- Added `--no-load-config` to disable loading config from `package.json` from root
- Added `--print-config` to print config for debugging purposes

The CLI now allows definition configs in `package.json` so your CLI args can be simplified. The `package.json`
(if it exists) is loaded from `--root` if specified, or cwd if not specified. It can have all the configurations
that can be specified in CLI (but only long names, eg. no `"e"`, only `"execute"`). For example:

```json5
// package.json
{
  "name": "package",
  // ...
  "sb-babel-cli": {"extensions": [".js", ".ts", ".tsx"]}
}
```

### 3.1.1

- Hotfix for passthrough non-primary args

### 3.1.0

- Add support for `--source-maps` in Babel CLI args and `--enable-source-maps` in Node.js passthrough args

### 3.0.0

- BREAKING: In watcher mode with `-x`, when respawning `process.exit()` is now called with `SIGHUP` signal.
This may affect how your program behaves.

### 2.1.0

- Add support for some NodeJS flags: --debug-port, --inspect-port, --inspect, --inspect-brk, --inspect-publish-uid
- Add support for pass-through of paramters with `--`, eg: `sb-babel-cli src -o lib -x lib/index.js -- --enable-debug --program-arg=value`

### 2.0.0

- Require at least Node v8
- Upgrade all dependencies

### 1.2.1

- Fix a bug with the recent option `--ignored-for-restart`

### 1.2.0

- Fix bugs from the recent typescript related changes
- Add new `--ignored-for-restart` option

### 1.1.0

- Add `--typescript` that enables processing of files ending with `.ts` and `.tsx`

### 1.0.5

- Remove an unnecessary deferred `process.exit`

### 1.0.4

- WHYYYY -HOW?? DID BABEL PRESET ENV APPEAR IN MANIFEST???

### 1.0.3

- Fix a regression where cache would not be saved when project had only a few files

### 1.0.2

- Fix a regression where cache directory would not be created if it didn't exist

### 1.0.1

- Fix a regression where some files were not processed when `-x/--execute` was not specified

### 1.0.0

- Iron out some bugs
- Debounce write to cache files
- Add a default execution delay (1 second)

### 0.2.1

- Support for Babel 7

### 0.1.2

- Fix support for `--write-flow-sources`

### 0.1.1

- Do not restart executed programs on file unlink (git checkouts are not smooth because of it)

### 0.1.0

- Add support for nodemon like execution with `-x/--execute`, `--execute-delay`

### 0.0.5

- Fix a bug sometimes when the CLI won't quit

### 0.0.4

- Upgrade to latest `sb-config-file`
- Upgrade anymatch and chokdar to latest versions

### 0.0.3

- Don't offer `babel-cli` from self

### 0.0.2

- Only transpile js files

### 0.0.1

- Initial release
