import { validatePackageSpec } from './validate-package-spec'
import { escapeShellArg } from './lib/escape-shell-args'
import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * Retrieves package metadata from the npm registry using `npm view`.
 * @param {Object} params - The parameters for the view function.
 * @param {string} params.packageName - The name of the package to view.
 * @param {boolean} [params.throwOnNotFound] - If true, then a '404' error will throw rather than return null.
 * @param {string} [params.version] - The specific version to view. If omitted, returns data for the latest version.
 * @returns {Promise<Object|null>} A promise that resolves to the parsed JSON object returned by `npm view --json` or
 *   `null` if no package info is found.
 */
const view = async({ packageName, throwOnNotFound, version }) => {
  if (!packageName) {
    throw new Error("Must provide 'packageName'.")
  }

  const pkgSpec = version ? `${packageName}@${version}` : packageName

  // Validate package spec for security
  validatePackageSpec(pkgSpec, { throwIfInvalid : true })

  // Escape for shell safety
  const escapedSpec = escapeShellArg(pkgSpec)
  const cmd = `npm view --json ${escapedSpec}`

  const execResult = tryExec(cmd, { noThrow : true })

  let result
  try {
    result = JSON.parse(execResult.stdout)
  }
  catch (e) {
    throw new Error(`Could not parse npm view output for '${pkgSpec}': ${e.message}`, { cause : e })
  }

  if (result?.error?.code?.includes('404') && throwOnNotFound !== true) {
    return null
  }
  else if (result.error !== undefined) {
    const err = new Error(result.error.summary || `There was an issue retrieving info on ${pkgSpec}.`)
    if (result.error.code?.includes('404')) {
      err.code = 'ENOENT'
    }
    throw err
  }
  else if (execResult.code !== 0) {
    const errMsg = 'There was an unknown error while invoking \'npm view\'. '
      + `(stdout: ${execResult.stdout}; stderr: ${execResult.stderr})`
    throw new Error(errMsg)
  }

  return result
}

export { view }
