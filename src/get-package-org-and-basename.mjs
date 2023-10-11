import { getPackageJSON } from './get-package-json'

const getPackageOrgAndBasename = async({ pkgDir, pkgJSON }) => {
  if (pkgDir !== undefined) {
    if (pkgJSON !== undefined) {
      throw new Error("getPackageOrgAndBasename: cannot specify both 'pkgJSON' and 'pkgDir'.")
    }
    pkgJSON = await getPackageJSON({ pkgDir })
  }

  const { name } = pkgJSON

  if (name.startsWith('@')) {
    const [org, basename] = name.slice(1).split('/')

    return { basename, org }
  }
  else {
    return {
      basename : name,
      org      : undefined
    }
  }
}

export { getPackageOrgAndBasename }
