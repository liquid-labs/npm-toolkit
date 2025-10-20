import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import * as semver from '@liquid-labs/semver-plus'

import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * @typedef {Object} UpdateResults
 * @property {boolean} updated - Whether any updates were found and applied.
 * @property {string[]} actions - The actions taken during the update.
 * @property {Object} result - The result of the update. This is the JSON emitted by `npm --json update` and may vary
 *   depending on the version of npm, specifically prior to or after v11.0.0.
 */

/**
 * Updates project dependencies or global installs. Requires at 'global' and/or `projectPath` be provided.
 * @param {Object} params - The parameters for the update function.
 * @param {boolean} [params.dryRun] - Check for outdated dependecies and display results, but don't actually update.
 * @param {boolean} [params.global] - Operate on the globally installed packages instead of `projectPath` dependencies.
 *   One of `global` and `projectPath` must be provided.
 * @param {string[]} [params.packages] - Only check the named packages. If `global` is true, this would be a list of
 *   global packages and otherwise a list of `projectPath` dependencies.
 * @param {string} [params.projectPath] - The path to the project to update. One of `global` and `projectPath` must be
 *   provided.
 * 
 */
const update = async({ dryRun, global, packages = [], projectPath }) => {
  if (projectPath === undefined && !global) {
    throw new Error("Must either set 'global' true (exclusive) and/or provide 'projectPath'.")
  }
  if (projectPath !== undefined && global === true) {
    throw new Error("Cannot set 'global' true and specify 'projectPath'; do one or the other.")
  }

  let packageName
  if (projectPath !== undefined) {
    const packageJSONPath = fsPath.join(projectPath, 'package.json')
    const packageJSONContents = await fs.readFile(packageJSONPath)
    const packageJSON = JSON.parse(packageJSONContents);
    ({ name: packageName } = packageJSON)
  }

  const actions = []
  let updateCommand

  // no 'set -e' because 'outdated' exits '1' if there's anything to update.
  let outdatedCommand = `npm ${global ? '--global ' : ''} --json outdated`

  if (packages.length > 0) {
    outdatedCommand += packages.join(' ')
  }

  const execOptions = { noThrow : true }
  if (global !== true) {
    execOptions.cwd = projectPath
  }
  const outdatedResult = tryExec(outdatedCommand, execOptions)
  if (outdatedResult.stderr) {
    // notice we can't check 'code' since 'no updates' exits with code '1'; this is arguably an npm bug...
    throw new Error(`There was an error gathering update data; stdout; command: ${outdatedCommand}; stdout: ${outdatedResult.stdout}, stderr: ${outdatedResult.stderr}`)
  }

  let outdatedData
  try {
    outdatedData = JSON.parse(outdatedResult.stdout)
  }
  catch (e) {
    throw new Error(`Could not parse update data '${outdatedResult.stdout}': ${e}`, { cause : e })
  }

  if (!outdatedData || Object.keys(outdatedData).length === 0) {
    actions.push(`No updates found for ${packageName ? `'${packageName}'` : 'global packages'}.`)
    return { updated : false, actions }
  }

  updateCommand = `npm i --json${dryRun ? ' --dry-run' : ''}`
  for (const pkgName in outdatedData) { // eslint-disable-line guard-for-in
    const { current, wanted, latest } = outdatedData[pkgName]
    if (current !== wanted) { // because 'latest' might be different than wanted
      updateCommand += ` ${pkgName}@${wanted}`
      actions.push(`${dryRun ? 'DRY RUN: ' : ''}Updated ${pkgName}@${current} to ${wanted}${wanted === latest ? ' (latest)' : ''}`)
    }
    else {
      actions.push(`${pkgName}@${current} is the latest in-range version.`)
    }
    if (semver.gt(latest, current, { includePrerelease : true })) {
      actions.push(`Update available for ${pkgName}@${current} to ${latest}. but was not automatically installed.`)
    }
  }

  const updateResult = tryExec(updateCommand, execOptions)
  if (updateResult.code !== 0) {
    throw new Error(`There was an error updating ${packageName ? `'${packageName}' at ${projectPath}` : 'global packages'}; ${updateResult.summary}`)
  }

  const result = JSON.parse(updateResult.stdout)

  return { updated : true, actions, result }
}

export { update }
