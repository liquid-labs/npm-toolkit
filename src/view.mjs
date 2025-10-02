import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * Retrieves package metadata from the npm registry using `npm view`.
 *
 * ### Parameters
 *
 * - `packageName`: __(req, string)__ the name of the package to view.
 * - `version`: __(opt, string)__ the specific version to view. If omitted, returns data for the latest version.
 *
 * ### Returns
 *
 * The parsed JSON object returned by `npm view --json`.
 */
const view = async({ packageName, version }) => {
  if (!packageName) {
    throw new Error("Must provide 'packageName'.")
  }

  const pkgSpec = version ? `${packageName}@${version}` : packageName
  const cmd = `npm view --json ${pkgSpec}`

  const result = tryExec(cmd, { noThrow: true })

  if (result.code !== 0) {
    throw new Error(`Package '${pkgSpec}' not found in registry.`)
  }

  try {
    return JSON.parse(result.stdout)
  }
  catch (e) {
    throw new Error(`Could not parse npm view output for '${pkgSpec}': ${e.message}`, { cause: e })
  }
}

export { view }
