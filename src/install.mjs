import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { getPackageOrgBasenameAndVersion } from './get-package-org-basename-and-version'

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
 * @typedef {Object} InstallResults
 * @property {string[]} installedPackages - The packages that were installed.
 * @property {string[]} localPackages - The local packages that were installed.
 * @property {string[]} productionPackages - The production packages that were installed.
 */

/**
 * Installs packages using `npm install`.
 * @param {Object} params - The parameters for the install function.
 * @param {string[]} [params.devPaths] - An array of paths to search for local packages. Any local packages found will
 *   be used instead of installing from the registry.
 * @param {boolean} [params.global] - Whether to install globally.
 * @param {string[]} params.packages - List of package specifiers to install. At least one package must be specified.
 * @param {string} [params.projectPath] - The path to the project to install.
 * @param {boolean} [params.saveDev] - Whether to save the package as a development dependency.
 * @param {boolean} [params.saveProd] - Whether to save the package as a production dependency. This is the default
 *   behavior.
 * @param {boolean} [params.verbose] - Whether to print verbose output.
 * @returns {Promise<InstallResults>} A promise that resolves to the results of the install.
 */
const install = async({ devPaths, global, packages, projectPath, saveDev, saveProd, verbose }) => {
  if (packages === undefined || packages.length === 0) {
    throw new Error("No 'packages' specified; specify at least one package.")
  }
  if (saveProd === true && saveDev === true) {
    throw new Error("Both 'saveDev' and 'saveProd' were specified.")
  }
  if (projectPath === undefined && global !== true) {
    throw new Error("Must specify 'projectPath' for non-global installs.")
  }

  const pathBit = projectPath === undefined ? '' : 'cd ' + projectPath + ' && '
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
          return localPath
        }
      }
      productionPackages.push(p)
      return p
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
