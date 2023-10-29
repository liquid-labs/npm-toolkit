# npm-toolkit
[![Unit tests](https://github.com/liquid-labs/npm-toolkit/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/npm-toolkit/actions/workflows/unit-tests-node.yaml)

A programmatic wrapper around key npm functions and package manipulation utilities.

## Installation

```bash
npm i @liquid-labs/npm-toolkit
```

## Usage

```javascript
import * as fsPath from 'node:path'

import * as npm from '@liquid-labs/npm-toolkit'

const pkgDir = fsPath.join('path', 'to', 'package')
const pkgJSON = npm.getPackageJSON(( pkgDir ))
const { org, basename } = npm.getPackageOrgAndBasename({ pkgJSON })

await nmp.update({ global: true })
await npm.install({ global: true, packages: ['npm-check' ]})
```