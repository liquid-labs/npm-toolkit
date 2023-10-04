import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import findRoot from 'find-root'

/**
 * Determines the package data (`package.json`) the package containing `pkgDir`. As `pkgDir` needs merely to be within
 * the package (and not necessarily the root), you can often use `__dirname`.
 *
 * ### Options
 *
 * - `pkgDir`: (opt) a directory within the package. This is not necessarily the root directory. Defaults to the process
 *   working directory.
 */
const getPackageJSON = async({ pkgDir = process.cwd() }) => {
  // TODO: would like to support caching using a passed in cache. That would give us the ability to clear the cache
  // whenever something else makes a state change
  const pkgRootDir = findRoot(pkgDir)

  const packagePath = fsPath.join(pkgRootDir, 'package.json') // we can trust we're in the root
  const packageContents = await fs.readFile(packagePath, { encoding : 'utf8' })
  const pkgJSON = JSON.parse(packageContents)

  return pkgJSON
}

export { getPackageJSON }
