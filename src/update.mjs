import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import * as semver from 'semver'

import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * Updates project dependencies or global installs. Requires at 'global' and/or `projectPath` be provided.
 * 
 * ### Parameters
 * 
 * - `dryRun`: __(opt,  boolean)__ check for outdated dependecies and display results, but don't actually update.
 * - `global`: __(cond, boolean)__ operate on the globally installed packages instead of `projectPath` dependencies. 
 *   One of `global` and `projectPath` must be provided.
 * - `packages`: __(opt, strings[])__ only check the named packages. If `global` is true, this would be a list of 
 *   global packages and otherwise a list of `projectPath` dependencies.
 * - `projectName` __(opt, string)__ the name of the project to use in user output. This should be the NPM name. If 
 *   none is provided, then the name will be extracted from `package.json` file at `projectPath`.
 * - `projectPath`: __(cond, string)__ the path to the project to update. One of `global` and `projectPath` must be 
 *   provided.
 */
const update = async ({ dryRun, global, packages = [], projectName, projectPath }) => {
  if (projectPath === undefined && !global) {
    throw new Error("Must either set 'global' true (exclusive) and/or provide 'projectPath'.")
  }
  if (projectPath !== undefined && global === true) {
    throw new Error("Cannot set 'global' true and specify 'projectPath'; do one or the other.")
  }

  if (projectPath === undefined) {
    const packageJSONPath = fsPath.join(projectPath, 'package.json')
    const packageJSONContents = await fs.readFile(packageJSONPath)
    const packageJSON = JSON.parse(packageJSONContents);
    ({ name: projectName } = packageJSON)
  }

  const actions = []
  let updateCommand


  // no 'set -e' because 'outdated' exits '1' if there's anything to update.
  let outdatedCommand = (global === true ? '' : `cd "${projectPath}";`) 
    + 'npm '
    + (global === true ? '--global ' : '')
    + '--json outdated'

  
  if (packages.length > 0) {
    outdatedCommand += packages.join(' ')
  }

  const outdatedResult = tryExec(outdatedCommand, { noThrow : true })
  if (outdatedResult.stderr) {
    // notice we can't check 'code' since 'no updates' exits with code '1'; this is arguably an npm bug...
    throw new Error(`There was an error gathering update data: ${outdatedResult.stdout}`)
  }

  let outdatedData
  try {
    outdatedData = JSON.parse(outdatedResult.stdout)
  }
  catch (err) {
    throw new Error(`Could not parse update data '${outdatedResult.stdout}': ${err}`, { cause: e })
  }

  if (!outdatedData || Object.keys(outdatedData).length === 0) {
    actions.push(`No updates found for '${projectName}'.`)
    return { updated : false, actions }
  }

  updateCommand = `npm i ${dryRun ? '--dry-run ' : ''}`
  for (const pkgName in outdatedData) { // eslint-disable-line guard-for-in
    const { current, wanted, latest } = outdatedData[pkgName]
    if (current !== wanted) { // because 'latest' might be different than wanted
      updateCommand += ` ${pkgName}@${wanted}`
      actions.push(`${dryRun ? 'DRY RUN: ' : ''}Updated ${pkgName}@${current} to ${wanted}${wanted === latest ? ' (latest)' : ''}`)
    }
    else if (semver.gt(latest, current, { includePrerelease : true })) {
      actions.push(`Major update available for ${pkgName}@${current} to ${latest}`)
    }
  }

  const updateResult = tryExec(`set -e
    cd "${projectPath}"
    ${updateCommand}`)
  if (updateResult.code !== 0) {
    throw new Error(`There was an error updating ${projectName} using '${updateCommand}': ${updateResult.stderr}`)
  }

  return { updated : true, actions }
}

export { update }
