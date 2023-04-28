import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

const setupTestPackage = async({ noReset = false, pkgName }) => {
  const testPath = fsPath.join(__dirname, pkgName)
  if (noReset !== true) {
    try {
      await fs.rm(testPath, { recursive : true })
    }
    catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    await fs.mkdir(testPath)
    tryExec(`cd ${testPath} && npm init -y`)
  }

  const pkgPath = fsPath.join(testPath, 'package.json')

  return { pkgPath, testPath }
}

export { setupTestPackage }
