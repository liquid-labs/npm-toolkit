import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import findRoot from 'find-root'

/**
 * Find and parses the `package.json` associated with the package containing `pkgDir`. The method will check parent
 * directories until it finds a `package.json` file or runs out of parent directories.
 * @param {string} pkgDir - The path to the package directory or sub-directory.
 * @returns {Promise<Object>} A promise that resolves to the parsed `package.json` file.
 */
const getPackageJSON = async(pkgDir = throw new Error('Must provide pkgDir.')) => {
  // TODO: would like to support caching using a passed in cache. That would give us the ability to clear the cache
  // whenever something else makes a state change
  const pkgRootDir = findRoot(pkgDir)
  if (!pkgRootDir) {
    throw new Error(`No 'package.json' found when searching package root from: ${pkgDir}`)
  }

  const packagePath = fsPath.join(pkgRootDir, 'package.json') // we can trust we're in the root
  const packageContents = await fs.readFile(packagePath, { encoding : 'utf8' })
  const pkgJSON = JSON.parse(packageContents)

  return pkgJSON
}

export { getPackageJSON }
