/* global describe expect test */
import { getPackageJSON } from '../get-package-json'

describe('getPackageJSON', () => {
  test('gets own package', async() => {
    const packageJSON = await getPackageJSON({ pkgDir : __dirname })
    expect(packageJSON.name).toBe('@liquid-labs/npm-toolkit')
  })
})
