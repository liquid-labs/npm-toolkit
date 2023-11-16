/* global describe expect test */
import { getPackageNameAndVersion } from '../get-package-name-and-version'

describe('getPackageNameAndVersion', () => {
  test.each([
    ['@acme/foo@12.7', '@acme/foo', '12.7'],
    ['@acme/foo@^12.7', '@acme/foo', '^12.7'],
    ['@acme/foo@12.*', '@acme/foo', '12.*'],
    ['foo@12.7', 'foo', '12.7'],
    ['foo@^12.7', 'foo', '^12.7'],
    ['foo@12.*', 'foo', '12.*'],
    ['@acme/foo', '@acme/foo', undefined],
    ['foo', 'foo', undefined]
  ])('%s -> name: %s and version: %s', (input, exName, exVersion) => {
    const { name, version } = getPackageNameAndVersion(input)
    expect(name).toBe(exName)
    expect(version).toBe(exVersion)
  })
})