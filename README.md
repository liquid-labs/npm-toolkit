# npm-toolkit
[![coverage: 91%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/npm-toolkit/pulls?q=is%3Apr+is%3Aclosed) [![Unit tests](https://github.com/liquid-labs/npm-toolkit/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/npm-toolkit/actions/workflows/unit-tests-node.yaml)

A programmatic wrapper around key npm functions and package data manipulation utilities.

## Installation

```bash
npm i @liquid-labs/npm-toolkit
```

## Usage

```javascript
import * as fsPath from 'node:path'

import * as npm from '@liquid-labs/npm-toolkit'

const pkgDir = fsPath.join('path', 'to', 'package')
const pkgJSON = await npm.getPackageJSON(( pkgDir ))
const { name, org, basename, version } = npm.getPackageOrgBasenameAndVersion({ pkgJSON })
// alt forms:
// const { name, org, basename, version } = await getPackageOrgBasenameAndVersion({ pkgDir })
// const { name, org, basename, version } = await getPackageOrgBasenameAndVersion('@acme/foo@^1.0')

await nmp.update({ global: true })
await npm.install({ global: true, packages: ['npm-check@latest' ]})
```
