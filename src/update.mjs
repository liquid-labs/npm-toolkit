import { tryExec } from '@liquid-labs/shell-toolkit'

const update = ({ pkgs, save, targetPath }) => {
  const pathBit = targetPath === undefined ? '' : 'cd ' + targetPath + ' && '
  const saveBit = save === true ? '--save ' : ''

  const pkgList = pkgs?.join(' ') || ''
  const cmd = pathBit + 'npm update ' + saveBit + pkgList
  tryExec(cmd)
}

export { update }