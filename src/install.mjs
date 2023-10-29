import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

const findLocalPackage = async({ devPaths, npmName }) => {
  let [org, basename] = npmName.split('/')
  if (basename === undefined) {
    basename = org
    org = undefined
  }
  else if (org.startsWith('@')) {
    org = org.slice(1) // we will add back on later to test both
  }
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
        const { name } = packageJSON
        if (npmName === name) {
          return fsPath.dirname(testPath)
        }
      }
    }
  }

  return null
}

const install = async({ devPaths, global, latest, packages, projectPath, saveDev, saveProd, verbose, version }) => {
  if (packages === undefined || packages.length === 0) {
    throw new Error("No 'packages' specified; specify at least one package.")
  }
  if (saveProd === true && saveDev === true) {
    throw new Error("Both 'saveDev' and 'saveProd' were specified.")
  }
  if (version !== undefined && packages?.length !== 1) {
    throw new Error("May only specify one package when specifying 'version'.")
  }
  if (latest !== undefined && version !== undefined) {
    throw new Error("May only specify 'latest' or 'version', but not both.")
  }

  const pathBit = projectPath === undefined ? '' : 'cd ' + projectPath + ' && '
  const globalBit = global === true ? '--global ' : ''
  const saveBit = saveDev === true ? '--save-dev ' : saveProd === true ? '--save-prod ' : ''
  const versionBit = latest === true ? '@latest' : version !== undefined ? '@' + version : ''

  const installPkgs = (await Promise.all(packages
    .map(async(p) => {
      if (devPaths) {
        const localPath = await findLocalPackage({ devPaths, npmName : p })
        if (localPath !== null) {
          return localPath
        }
      }
      return p + versionBit
    })))
    .join(' ')

  const cmd = pathBit + 'npm install ' + globalBit + saveBit + installPkgs
  tryExec(cmd, { silent : !verbose })
}

export { install }
