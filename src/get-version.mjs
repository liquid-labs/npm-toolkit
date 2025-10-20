import { tryExec } from '@liquid-labs/shell-toolkit'

const getVersion = async() => {
    console.log('getVersion') // DEBUG
    const nodeVerCmd = 'node --version'
    const nodeVerRes = tryExec(nodeVerCmd)
    const nodeVer = nodeVerRes.stdout.trim().replace(/^v/, '')

    const npmVerCmd = 'npm --version'
    const npmVerRes = tryExec(npmVerCmd)
    const npmVer = npmVerRes.stdout.trim().replace(/^v/, '')
  
    return { nodeVer, npmVer }
  }
  
  export { getVersion }
  