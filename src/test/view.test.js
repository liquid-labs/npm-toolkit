/* global describe expect test */
import { view } from '../view'

describe('view', () => {
  test('retrieves package metadata for a known package', async() => {
    const result = await view({ packageName: 'http-errors' })

    expect(result).toBeDefined()
    expect(result.name).toBe('http-errors')
    expect(result.version).toBeDefined()
    expect(result.description).toBeDefined()
  })

  test('retrieves metadata for a specific version', async() => {
    const result = await view({ packageName: 'http-errors', version: '2.0.0' })

    expect(result).toBeDefined()
    expect(result.name).toBe('http-errors')
    expect(result.version).toBe('2.0.0')
  })

  test('retrieves metadata for a scoped package', async() => {
    const result = await view({ packageName: '@liquid-labs/shell-toolkit' })

    expect(result).toBeDefined()
    expect(result.name).toBe('@liquid-labs/shell-toolkit')
    expect(result.version).toBeDefined()
  })

  test('retrieves metadata for a scoped package with version', async() => {
    const result = await view({ packageName: '@liquid-labs/shell-toolkit', version: '1.0.0-alpha.4' })

    expect(result).toBeDefined()
    expect(result.name).toBe('@liquid-labs/shell-toolkit')
    expect(result.version).toBe('1.0.0-alpha.4')
  })

  test('throws error when packageName is not provided', async() => {
    await expect(view({})).rejects.toThrow(/Must provide 'packageName'/)
  })

  test('throws error for non-existent package', async() => {
    await expect(
      view({ packageName: 'this-package-definitely-does-not-exist-12345' })
    ).rejects.toThrow(/not found in registry/)
  })

  test('throws error for non-existent version', async() => {
    await expect(
      view({ packageName: 'http-errors', version: '999.999.999' })
    ).rejects.toThrow(/not found in registry/)
  })

  test('returns complete package data structure', async() => {
    const result = await view({ packageName: 'http-errors', version: '2.0.0' })

    // Verify common npm view fields are present
    expect(result.name).toBe('http-errors')
    expect(result.version).toBe('2.0.0')
    expect(result.description).toBeDefined()
    expect(result.license).toBeDefined()
    expect(result.repository).toBeDefined()
    expect(result.dependencies).toBeDefined()
  })

  test('handles package names with special characters', async() => {
    // Using a real package with hyphens
    const result = await view({ packageName: 'find-root' })

    expect(result).toBeDefined()
    expect(result.name).toBe('find-root')
  })
})
