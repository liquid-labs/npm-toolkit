import { tryExec } from '@liquid-labs/shell-toolkit'

const update = ({ global, pkgs, save, targetPath, verbose }) => {
  const pathBit = targetPath === undefined ? '' : 'cd ' + targetPath + ' && '
  const globalBit = global === true ? '--global ' : ''
  const saveBit = save === true ? '--save ' : ''

  const pkgList = pkgs?.join(' ') || ''
  const cmd = pathBit + 'npm update ' + globalBit + saveBit + pkgList
  tryExec(cmd, { silent : !verbose })
}

export { update }
