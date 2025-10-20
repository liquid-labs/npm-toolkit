import { getPackageJSON } from './get-package-json'

const getDataFromSpec = (pkgSpec) => {
  // Note, the version can be a semver or any tag which is not a semver, so there's no useful validation to be done.
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

/**
 * xtracts the package name, organization, basename, and version from a project's `package.json` file.
 * @param {string|Object} input - If a string, it's treated as a package spec (e.g. '@acme/foo@^1.0'). Otherwise,
 *   `input` is an object with exactly one of `pkgDir`, `pkgJSON`, or `pkgSpec` specified.
 * @param {string} [input.pkgDir] - The path to the package directory.
 * @param {Object} [input.pkgJSON] - The parsed `package.json` file.
 * @param {string} [input.pkgSpec] - The package spec to extract the package name, organization, basename, and version
 *   from. This can be a scoped package spec (e.g., `@acme/foo@^1.0`) or an unscoped package spec (e.g., `foo@1.0.0`).
 * @returns {Promise<{name: string, org: string, basename: string, version: string}>} A promise that resolves to an
 *   object with the package name, organization, basename, and version.
 */
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
      pkgJSON = await getPackageJSON(pkgDir)
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
