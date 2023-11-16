/* global describe expect test */
import * as fsPath from 'node:path'

import { getPackageOrgBasenameAndVersion } from '../get-package-org-basename-and-version'

const packageSpecData = [
  ['@acme/foo@12.7', '@acme/foo', 'acme', 'foo', '12.7'],
  ['@acme/foo@^12.7', '@acme/foo', 'acme', 'foo', '^12.7'],
  ['@acme/foo@12.*', '@acme/foo', 'acme', 'foo', '12.*'],
  ['foo@12.7', 'foo', undefined, 'foo', '12.7'],
  ['foo@^12.7', 'foo', undefined, 'foo', '^12.7'],
  ['foo@12.*', 'foo', undefined, 'foo', '12.*'],
  ['@acme/foo', '@acme/foo', 'acme', 'foo', undefined],
  ['@liquid-labs/npm-toolkit', '@liquid-labs/npm-toolkit', 'liquid-labs', 'npm-toolkit', undefined],
  ['foo', 'foo', undefined, 'foo', undefined]
]

describe('getPackageOrgBasenameAndVersion', () => {
  describe('extracting from string package spec', () => {
    test.each(packageSpecData)('%s -> name: %s, org: %s, basename: %s, version: %s',
        async(input, exName, exOrg, exBasename, exVersion) => {
      const { name, org, basename, version } = await getPackageOrgBasenameAndVersion(input)
      expect(name).toBe(exName)
      expect(org).toBe(exOrg)
      expect(basename).toBe(exBasename)
      expect(version).toBe(exVersion)
    })
  })

  describe('extracting from pkgSpec', () => {
    test.each(packageSpecData)('%s -> name: %s, org: %s, basename: %s, version: %s',
        async(input, exName, exOrg, exBasename, exVersion) => {
      const { name, org, basename, version } = await getPackageOrgBasenameAndVersion({ pkgSpec: input })
      expect(name).toBe(exName)
      expect(org).toBe(exOrg)
      expect(basename).toBe(exBasename)
      expect(version).toBe(exVersion)
    })
  })

  describe('extracting from pkgJSON', () => {
    test('handles a root-name package', async() => {
      const { name, org, basename, version } = 
        await getPackageOrgBasenameAndVersion({ pkgJSON : { name : 'foo', version: '1.0.2' }})
      expect(name).toBe('foo')
      expect(org).toBe(undefined)
      expect(basename).toBe('foo')
      expect(version).toBe('1.0.2')
    })

    test('handles an org scoped package', async() => {
      const { name, org, basename, version } = 
        await getPackageOrgBasenameAndVersion({ pkgJSON : { name : '@acme/foo', version: '1.0.3' }})
      expect(name).toBe('@acme/foo')
      expect(org).toBe('acme')
      expect(basename).toBe('foo')
      expect(version).toBe('1.0.3')
    })
  })

  describe('extracting from pkgDir', () => {
    test("handle an org scoped package", async() => {
      const pkgDir = fsPath.join(__dirname, 'data', 'pkgA')
      const { name, org, basename, version } = await getPackageOrgBasenameAndVersion({ pkgDir })
      expect(name).toBe('@acme/pkg-a')
      expect(org).toBe('acme')
      expect(basename).toBe('pkg-a')
      expect(version).toBe('1.0.1')
    })
  })
})
