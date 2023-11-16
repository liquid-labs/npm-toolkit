import { getPackageJSON } from './get-package-json'

const getDataFromSpec = (pkgSpec) => {
  if (pkgSpec.startsWith('@')) {
    const [org, remainder] = pkgSpec.slice(1).split('/')
    const [basename, version] = remainder.split('@')
    const name = `@${org}/${basename}`
    return { name, basename, org, version }
  }
  else {
    const [basename, version] = pkgSpec.split('@')
    return { name : basename, basename, version }
  }
}

const getPackageOrgBasenameAndVersion = async(input) => {
  let name, version
  if ((typeof input) === 'string') {
    return getDataFromSpec(input)
  }
  else {
    const argCount = Object.keys(input).length
    if (argCount > 1 || argCount === 0) {
      throw new Error("getPackageOrgBasenameAndVersion: accepts a string 'package spec' or an object with exactly one of 'pkgDir', 'pkgJSON', or 'pkgSpec'.")
    }
    const { pkgDir } = input
    let { pkgJSON, pkgSpec } = input

    if (pkgDir !== undefined) {
      pkgJSON = await getPackageJSON({ pkgDir })
    }
    if (pkgJSON !== undefined) {
      name = pkgJSON.name
      version = pkgJSON.version
      const { org, basename } = getDataFromSpec(name)

      return { name, basename, org, version }
    }
    // else, we have pkgSpec
    return getDataFromSpec(pkgSpec)
  }
}

export { getPackageOrgBasenameAndVersion }
