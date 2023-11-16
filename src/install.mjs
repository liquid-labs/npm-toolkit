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
