### 1.2.0

- Fix bugs from the recent typescript related changes

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
