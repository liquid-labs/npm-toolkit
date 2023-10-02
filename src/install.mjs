import { existsSync } from 'node:fs'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

const findLocalPackage = ({ devPaths, npmName }) => {
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
      for (const testPath of [fsPath.join(devPath, pkgPath), fsPath.join(devPath, '@' + pkgPath)]) {
        if (existsSync(testPath)) {
          return fsPath.dirname(testPath)
        }
      }
    }

    return null
  }

const install = ({ devPaths, global, latest, pkgs, saveDev, saveProd, targetPath, verbose, version }) => {
  if (pkgs === undefined || pkgs.length === 0) {
    throw new Error("No 'pkgs' specified; specify at least one package.")
  }
  if (saveProd === true && saveDev === true) {
    throw new Error("Both 'saveDev' and 'saveProd' were specified.")
  }
  if (version !== undefined && pkgs?.length !== 1) {
    throw new Error("May only specify one package when specifying 'version'.")
  }
  if (latest !== undefined && version !== undefined) {
    throw new Error("May only specify 'latest' or 'version', but not both.")
  }

  const pathBit = targetPath === undefined ? '' : 'cd ' + targetPath + ' && '
  const globalBit = global === true ? '--global ' : ''
  const saveBit = saveDev === true ? '--save-dev ' : saveProd === true ? '--save-prod ' : ''
  const versionBit = latest === true ? '@latest' : version !== undefined ? '@' + version : ''

  const installPkgs = pkgs
    .map((p) => {
      if (devPaths) {
        const localPath = findLocalPackage({ devPaths, npmName: p })
        if (localPath !== null) {
          return localPath
        }
      }
      return p + versionBit
    })
    .join(' ')

  const cmd = pathBit + 'npm install ' + globalBit + saveBit + installPkgs
  tryExec(cmd, { silent : !verbose })
}

export { install }
