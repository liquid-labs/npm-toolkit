/* global describe expect test */
import * as fsPath from 'node:path'
import { getPackageOrgAndBasename } from '../get-package-org-and-basename'

describe('getPackageOrgAndBasename', () => {
  test('handles a root-name package', async() => {
    const { org, basename } = await getPackageOrgAndBasename({ pkgJSON : { name : 'foo' } })
    expect(org).toBe(undefined)
    expect(basename).toBe('foo')
  })

  test('handles an org scoped package', async() => {
    const { org, basename } = await getPackageOrgAndBasename({ pkgJSON : { name : '@acme/foo' } })
    expect(org).toBe('acme')
    expect(basename).toBe('foo')
  })

  test("will read from the filesystem when 'pkgDir' specified", async() => {
    const pkgDir = fsPath.join(__dirname, 'data', 'pkgA')
    const { org, basename } = await getPackageOrgAndBasename({ pkgDir })
    expect(org).toBe('acme')
    expect(basename).toBe('pkg-a')
  })
})
