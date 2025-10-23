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
##  API reference
_API generated with [dmd-readme-api](https://www.npmjs.com/package/dmd-readme-api)._

<span id="global-function-index"></span>
- Functions:
  - [`getPackageJSON()`](#getPackageJSON): Find and parses the `package.json` associated with the package containing `pkgDir`.
  - [`getPackageOrgBasenameAndVersion()`](#getPackageOrgBasenameAndVersion): xtracts the package name, organization, basename, and version from a project's `package.json` file.
  - [`getVersion()`](#getVersion): Retrieves the version of Node.js and npm installed on the system.
  - [`install()`](#install): Installs packages using `npm install`.
  - [`update()`](#update): Updates project dependencies or global installs.
  - [`validatePackageSpec()`](#validatePackageSpec): Validates that a package specification is safe for use in shell commands and file operations.
  - [`view()`](#view): Retrieves package metadata from the npm registry using `npm view`.

<a id="getPackageJSON"></a>
### `getPackageJSON(pkgDir)` ⇒ `Promise.<Object>` <sup>↱<sup>[source code](./src/get-package-json.mjs#L12)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Find and parses the `package.json` associated with the package containing `pkgDir`. The method will check parent
directories until it finds a `package.json` file or runs out of parent directories.


| Param | Type | Description |
| --- | --- | --- |
| `pkgDir` | `string` | The path to the package directory or sub-directory. |

**Returns**: `Promise.<Object>` - A promise that resolves to the parsed `package.json` file.

<a id="getPackageOrgBasenameAndVersion"></a>
### `getPackageOrgBasenameAndVersion(input)` ⇒ `Promise.<{name: string, org: string, basename: string, version: string}>` <sup>↱<sup>[source code](./src/get-package-org-basename-and-version.mjs#L29)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

xtracts the package name, organization, basename, and version from a project's `package.json` file.


| Param | Type | Description |
| --- | --- | --- |
| `input` | `string` \| `Object` | If a string, it's treated as a package spec (e.g. '@acme/foo@^1.0'). Otherwise,   `input` is an object with exactly one of `pkgDir`, `pkgJSON`, or `pkgSpec` specified. |
| [`input.pkgDir`] | `string` | The path to the package directory. |
| [`input.pkgJSON`] | `Object` | The parsed `package.json` file. |
| [`input.pkgSpec`] | `string` | The package spec to extract the package name, organization, basename, and version   from. This can be a scoped package spec (e.g., `@acme/foo@^1.0`) or an unscoped package spec (e.g., `foo@1.0.0`). |

**Returns**: `Promise.<{name: string, org: string, basename: string, version: string}>` - A promise that resolves to an
  object with the package name, organization, basename, and version.

<a id="getVersion"></a>
### `getVersion()` ⇒ `Promise.<{nodeVer: string, npmVer: string}>` <sup>↱<sup>[source code](./src/get-version.mjs#L8)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Retrieves the version of Node.js and npm installed on the system.

**Returns**: `Promise.<{nodeVer: string, npmVer: string}>` - A promise that resolves to an object with the Node.js and npm
  versions as strings without the `v` prefix.

<a id="install"></a>
### `install(params)` ⇒ `Promise.<{installedPackages: Array.<string>, localPackages: Array.<string>, productionPackages: Array.<string>}>` <sup>↱<sup>[source code](./src/install.mjs#L55)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Installs packages using `npm install`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `params` | `Object` |  | The parameters for the install function. |
| [`params.allowFilePackages`] | `boolean` | `false` | Whether to allow 'file:' protocol package specs (e.g., 'file:../pkg'). |
| [`params.devPaths`] | `Array.<string>` |  | An array of paths to search for local packages. Any local packages found will   be used instead of installing from the registry. |
| [`params.global`] | `boolean` |  | Whether to install globally. |
| `params.packages` | `Array.<string>` |  | List of package specifiers to install. At least one package must be specified. |
| [`params.projectPath`] | `string` |  | The path to the project to install. |
| [`params.saveDev`] | `boolean` |  | Whether to save the package as a development dependency. |
| [`params.saveProd`] | `boolean` |  | Whether to save the package as a production dependency. This is the default   behavior. |
| [`params.verbose`] | `boolean` |  | Whether to print verbose output. |

**Returns**: `Promise.<{installedPackages: Array.<string>, localPackages: Array.<string>, productionPackages: Array.<string>}>` - A promise
  that resolves to a summary of the installed packages.

<a id="update"></a>
### `update(params)` ⇒ `Promise.<{updated: boolean, actions: Array.<string>, result: Object}>` <sup>↱<sup>[source code](./src/update.mjs#L24)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Updates project dependencies or global installs. Requires at 'global' and/or `projectPath` be provided.


| Param | Type | Description |
| --- | --- | --- |
| `params` | `Object` | The parameters for the update function. |
| [`params.dryRun`] | `boolean` | Check for outdated dependecies and display results, but don't actually update. |
| [`params.global`] | `boolean` | Operate on the globally installed packages instead of `projectPath` dependencies.   One of `global` and `projectPath` must be provided. |
| [`params.packages`] | `Array.<string>` | Only check the named packages. If `global` is true, this would be a list of   global packages and otherwise a list of `projectPath` dependencies. |
| [`params.projectPath`] | `string` | The path to the project to update. One of `global` and `projectPath` must be   provided. |

**Returns**: `Promise.<{updated: boolean, actions: Array.<string>, result: Object}>` - A promise that resolves to a summary of
  the updates.

<a id="validatePackageSpec"></a>
### `validatePackageSpec(packageSpec, [options])` ⇒ `Object` <sup>↱<sup>[source code](./src/validate-package-spec.mjs#L16)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Validates that a package specification is safe for use in shell commands and file operations.
Supports standard npm package specs and file: protocol packages when allowFilePackages is true.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `packageSpec` | `string` |  | The package specification to validate (e.g., 'package@1.0.0', '@scope/pkg', 'file:../pkg') |
| [`options`] | `Object` |  | Validation options |
| [`options.allowFilePackages`] | `boolean` | `false` | Whether to allow 'file:' protocol package specs |
| [`options.throwIfInvalid`] | `boolean` | `false` | If true, throws an error on validation failure. If false, returns result object with isValid=false. |

**Returns**: `Object` - Validation result with { isValid: boolean, errorMsg?: string, isFilePackage?: boolean, cleanSpec?: string, packageName?: string, versionPart?: string, resolvedPath?: string }

**Throws**: Validates that a package specification is safe for use in shell commands and file operations.
Supports standard npm package specs and file: protocol packages when allowFilePackages is true.

<a id="view"></a>
### `view(params)` ⇒ `Promise.<Object>` <sup>↱<sup>[source code](./src/view.mjs#L12)</sup></sup> <sup>⇧<sup>[global index](#global-function-index)</sup></sup>

Retrieves package metadata from the npm registry using `npm view`.


| Param | Type | Description |
| --- | --- | --- |
| `params` | `Object` | The parameters for the view function. |
| `params.packageName` | `string` | The name of the package to view. |
| [`params.version`] | `string` | The specific version to view. If omitted, returns data for the latest version. |

**Returns**: `Promise.<Object>` - A promise that resolves to the parsed JSON object returned by `npm view --json`.

