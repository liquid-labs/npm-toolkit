import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * Retrieves the version of Node.js and npm installed on the system.
 * @returns {Promise<GetVersionResults>} A promise that resolves to an object containing the Node.js and npm versions.
 * @typedef {Object} GetVersionResults
 * @property {string} nodeVer - The version of Node.js installed on the system.
 * @property {string} npmVer - The version of npm installed on the system.
 */
const getVersion = async() => {
  const nodeVerCmd = 'node --version'
  const nodeVerRes = tryExec(nodeVerCmd)
  const nodeVer = nodeVerRes.stdout.trim().replace(/^v/, '')

  const npmVerCmd = 'npm --version'
  const npmVerRes = tryExec(npmVerCmd)
  const npmVer = npmVerRes.stdout.trim().replace(/^v/, '')

  return { nodeVer, npmVer }
}

export { getVersion }
