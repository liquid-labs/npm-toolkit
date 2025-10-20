/* global describe expect test */
import { getPackageJSON } from '../get-package-json'

describe('getPackageJSON', () => {
  test('gets own package', async() => {
    const packageJSON = await getPackageJSON(__dirname)
    expect(packageJSON.name).toBe('@liquid-labs/npm-toolkit')
  })

  test('raises an error if pkgDir is not defined', async() => {
    try {
      await getPackageJSON()
      throw new Error('did not throw')
    }
    catch (e) {
      expect(e.message).toMatch(/Must provide pkgDir/)
    }
  })
})
