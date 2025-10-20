# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@liquid-labs/npm-toolkit` is a programmatic wrapper around key npm functions and package manipulation utilities. It provides JavaScript APIs for common npm operations like install, update, and package.json parsing.

## Build System

This project uses a Makefile-based build system powered by Catalyst resources. All build configurations (Babel, Rollup, Jest, ESLint) are externalized to Catalyst resource packages.

### Key Commands

- `npm run build` or `make` - Build the project (compiles src/index.js → dist/npm-toolkit.js using Rollup + Babel)
- `npm run lint` or `make lint` - Run ESLint on all source files
- `npm run lint:fix` or `make lint-fix` - Auto-fix linting issues
- `npm run test` or `make test` - Run Jest tests
- `npm run qa` or `make qa` - Run both tests and linting (quality assurance)

### Running Individual Tests

To run a specific test file:
```bash
cd test-staging && npx jest --config=$(npm explore @liquid-labs/catalyst-resource-jest -- pwd)/dist/jest.config.js <test-file-pattern>
```

Note: Tests must be run from the `test-staging` directory after building test files with `make test` at least once.

## Architecture

### Source Structure

- `src/*.mjs` - Core library modules (ES modules)
- `src/index.js` - Main entry point that re-exports all public APIs
- `src/test/*.test.js` - Jest test files
- `dist/npm-toolkit.js` - Built output (bundled with Rollup)

### Core Modules

**getPackageJSON** (`src/get-package-json.mjs`)
- Finds and parses package.json from any directory within a package
- Uses `find-root` to locate package root
- Takes `pkgDir` parameter (can be any directory within package, e.g., `__dirname`)

**getPackageOrgBasenameAndVersion** (`src/get-package-org-basename-and-version.mjs`)
- Extracts package metadata (name, org, basename, version)
- Accepts three input types:
  1. String package spec (e.g., `@acme/foo@^1.0`)
  2. Object with `pkgDir` (directory path)
  3. Object with `pkgJSON` (parsed package.json)
  4. Object with `pkgSpec` (package spec string)
- Handles both scoped (@org/name) and unscoped packages

**install** (`src/install.mjs`)
- Programmatic wrapper for `npm install`
- Supports local development installs via `devPaths` parameter
- When `devPaths` is provided, searches for local package directories before installing from registry
- Options: `global`, `saveDev`, `saveProd`, `packages`, `projectPath`, `verbose`
- Returns: `{ installedPackages, localPackages, productionPackages }`

**update** (`src/update.mjs`)
- Programmatic wrapper for `npm update`
- Uses `npm outdated` to check for updates
- Distinguishes between wanted (semver-compatible) and latest (major) updates
- Options: `dryRun`, `global`, `packages`, `projectName`, `projectPath`
- Returns: `{ updated: boolean, actions: string[] }`

### Key Patterns

1. **Error Handling**: All functions validate required parameters and throw descriptive errors
2. **Dual Input Support**: Functions accept either pre-parsed data or paths (for convenience)
3. **Shell Execution**: Uses `tryExec` from `@liquid-labs/shell-toolkit` for npm commands
4. **Local Development**: Install function supports linking to local packages via `devPaths` search

## Build Configuration

All build tool configurations are managed by external Catalyst packages:
- Babel: `@liquid-labs/catalyst-resource-babel-and-rollup`
- Rollup: `@liquid-labs/catalyst-resource-babel-and-rollup`
- Jest: `@liquid-labs/catalyst-resource-jest`
- ESLint: `@liquid-labs/catalyst-resource-eslint`

The Makefile dynamically locates these configs using `npm explore`.

## Testing

- Uses Jest for unit testing
- Tests are transpiled with Babel to `test-staging/` before running
- Source maps are inlined for test execution
- Test data files are copied from `src/test/data/` to `test-staging/`
- Coverage reports generated to `qa/coverage/`
