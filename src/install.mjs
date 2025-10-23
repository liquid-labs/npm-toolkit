import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { getPackageOrgBasenameAndVersion } from './get-package-org-basename-and-version'
import { validatePackageSpec } from './validate-package-spec'
import { validatePath } from './lib/validate-path'
import { escapeShellArg } from './lib/escape-shell-args'

import { tryExec } from '@liquid-labs/shell-toolkit'

const findLocalPackage = async({ devPaths, pkgSpec }) => {
  const { name, org, basename } = await getPackageOrgBasenameAndVersion(pkgSpec)

  const pkgPath = org === undefined
    ? fsPath.join(basename, 'package.json')
    : fsPath.join(org, basename, 'package.json')
  for (const devPath of devPaths) {
    // TODO: this is a workaround until we transition fully to matching NPM names
    for (const testPath of [
      fsPath.join(devPath, 'package.json'),
      fsPath.join(devPath, pkgPath),
      fsPath.join(devPath, '@' + pkgPath)
    ]) {
      if (existsSync(testPath)) {
        const packageJSONContents = await fs.readFile(testPath, { encoding : 'utf8' })
        const packageJSON = JSON.parse(packageJSONContents)
        const { name: testName } = packageJSON
        if (testName === name) {
          return fsPath.dirname(testPath)
        }
      }
    }
  }

  return null
}

/**
 * Installs packages using `npm install`.
 * @param {Object} params - The parameters for the install function.
 * @param {boolean} [params.allowFilePackages=false] - Whether to allow 'file:' protocol package specs (e.g., 'file:../pkg').
 * @param {string[]} [params.devPaths] - An array of paths to search for local packages. Any local packages found will
 *   be used instead of installing from the registry.
 * @param {boolean} [params.global] - Whether to install globally.
 * @param {string[]} params.packages - List of package specifiers to install. At least one package must be specified.
 * @param {string} [params.projectPath] - The path to the project to install.
 * @param {boolean} [params.saveDev] - Whether to save the package as a development dependency.
 * @param {boolean} [params.saveProd] - Whether to save the package as a production dependency. This is the default
 *   behavior.
 * @param {boolean} [params.verbose] - Whether to print verbose output.
 * @returns {Promise<{installedPackages: string[], localPackages: string[], productionPackages: string[]}>} A promise
 *   that resolves to a summary of the installed packages.
 */
const install = async({ allowFilePackages = false, devPaths, global, packages, projectPath, saveDev, saveProd, verbose }) => {
  if (packages === undefined || packages.length === 0) {
    throw new Error("No 'packages' specified; specify at least one package.")
  }
  if (saveProd === true && saveDev === true) {
    throw new Error("Both 'saveDev' and 'saveProd' were specified.")
  }
  if (projectPath === undefined && global !== true) {
    throw new Error("Must specify 'projectPath' for non-global installs.")
  }

  // Validate all package specs upfront
  for (const pkg of packages) {
    validatePackageSpec(pkg, { allowFilePackages, throwIfInvalid : true })
  }

  // Validate and escape projectPath if provided
  let pathBit = ''
  if (projectPath !== undefined) {
    validatePath(projectPath)
    pathBit = 'cd ' + escapeShellArg(projectPath) + ' && '
  }
  const globalBit = global === true ? '--global ' : ''
  const saveBit = saveDev === true ? '--save-dev ' : saveProd === true ? '--save-prod ' : ''

  const localPackages = []
  const productionPackages = []
  const installedPackages = []
  const installPkgs = (await Promise.all(packages
    .map(async(p) => {
      installedPackages.push(p)
      if (devPaths) {
        const localPath = await findLocalPackage({ devPaths, pkgSpec : p })
        if (localPath !== null) {
          localPackages.push(p)
          // Escape local path for shell safety
          return escapeShellArg(localPath)
        }
      }
      productionPackages.push(p)
      // Package specs are already validated, but escape for shell safety
      return escapeShellArg(p)
    })))
    .join(' ')
  const cmd = pathBit + 'npm install ' + globalBit + saveBit + installPkgs
  tryExec(cmd, { silent : !verbose })
  return {
    installedPackages,
    localPackages,
    productionPackages
  }
}

export { install }
