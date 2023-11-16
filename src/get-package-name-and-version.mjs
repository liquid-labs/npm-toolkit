const getPackageNameAndVersion = (packageSpec) => {
  let name, version
  if (packageSpec.startsWith('@')) {
    const i = packageSpec.lastIndexOf('@')
    if (i > 0) {
      name = packageSpec.slice(0, i)
      version = packageSpec.slice(i + 1)
    }
    else {
      name = packageSpec
      // version is undefined
    }
  }
  else {
    ([name, version] = packageSpec.split('@'))
  }

  return { name, version }
}

export { getPackageNameAndVersion }
