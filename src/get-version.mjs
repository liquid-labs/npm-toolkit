import { tryExec } from '@liquid-labs/shell-toolkit'

/**
 * Retrieves the version of Node.js and npm installed on the system.
 * @returns {Promise<{nodeVer: string, npmVer: string}>} A promise that resolves to an object with the Node.js and npm
 *   versions as strings without the `v` prefix.
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
