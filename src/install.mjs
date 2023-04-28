import { tryExec } from '@liquid-labs/shell-toolkit'

const install = ({ latest, pkgs, saveDev, saveProd, targetPath, version }) => {
  if (pkgs === undefined || pkgs.length === 0) {
    throw new Error("No 'pkgs' specified; specify at least one package.")
  }
  if (saveProd === true && saveDev === true) {
    throw new Error("Both 'saveDev' and 'saveProd' were specified.")
  }
  if (version !== undefined && pkgs?.length !== 1) {
    throw new Error("May only specify one package when specifying 'version'.")
  }
  if (latest !== undefined && version !== undefined) {
    throw new Error("May only specify 'latest' or 'version', but not both.")
  }

  const pathBit = targetPath === undefined ? '' : 'cd ' + targetPath + ' && '
  const saveBit = saveDev === true ? '--save-dev ' : saveProd === true ? '--save-prod ' : ''
  const versionBit = latest === true ? '@latest' : version !== undefined ? '@' + version : ''

  const installPkgs = pkgs.map((p) => p + versionBit).join(' ')

  const cmd = pathBit + 'npm install ' + saveBit + installPkgs
  tryExec(cmd)
}

export { install }
