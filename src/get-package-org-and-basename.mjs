import { getPackageJSON } from './get-package-json'

const getPackageOrgAndBasename = async(options = {}) => {
  const argCount = Object.keys(options).length
  if (argCount > 1 || argCount === 0) {
    throw new Error("getPackageOrgAndBasename: must specify exactly one of 'pkgDir', 'pkgJSON', or 'pkgName'.")
  }
  const { pkgDir } = options
  let { pkgJSON, pkgName } = options

  if (pkgDir !== undefined) {
    pkgJSON = await getPackageJSON({ pkgDir })
  }
  if (pkgJSON !== undefined) {
    pkgName = pkgJSON.name
  }

  if (pkgName.startsWith('@')) {
    const [org, basename] = pkgName.slice(1).split('/')
    return { basename, org }
  }
  else {
    return {
      basename : pkgName,
      org      : undefined
    }
  }
}

export { getPackageOrgAndBasename }
