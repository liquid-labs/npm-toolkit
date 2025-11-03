/* global describe expect test */
import { view } from '../view'

describe('view', () => {
  test('retrieves package metadata for a known package', async() => {
    const result = await view({ packageName : 'http-errors' })

    expect(result).toBeDefined()
    expect(result.name).toBe('http-errors')
    expect(result.version).toBeDefined()
    expect(result.description).toBeDefined()
  })

  test('retrieves metadata for a specific version', async() => {
    const result = await view({ packageName : 'http-errors', version : '2.0.0' })

    expect(result).toBeDefined()
    expect(result.name).toBe('http-errors')
    expect(result.version).toBe('2.0.0')
  })

  test('retrieves metadata for a scoped package', async() => {
    const result = await view({ packageName : '@liquid-labs/shell-toolkit' })

    expect(result).toBeDefined()
    expect(result.name).toBe('@liquid-labs/shell-toolkit')
    expect(result.version).toBeDefined()
  })

  test('retrieves metadata for a scoped package with version', async() => {
    const result = await view({ packageName : '@liquid-labs/shell-toolkit', version : '1.0.0-alpha.4' })

    expect(result).toBeDefined()
    expect(result.name).toBe('@liquid-labs/shell-toolkit')
    expect(result.version).toBe('1.0.0-alpha.4')
  })

  test('throws error when packageName is not provided', async() => {
    await expect(view({})).rejects.toThrow(/Must provide 'packageName'/)
  })

  test('returns null for non-existent package (throwOnNotFound : unset)', async() => {
    await expect(
      view({ packageName : 'this-package-definitely-does-not-exist-12345' })
    ).resolves.toBe(null)
  })

  test('returns null for non-existent version (throwOnNotFound : unset)', async() => {
    await expect(
      view({ packageName : 'http-errors', version : '999.999.999' })
    ).resolves.toBe(null)
  })

  test('throws error for non-existent package (throwOnNotFound : true)', async() => {
    await expect(
      view({ packageName : 'this-package-definitely-does-not-exist-12345', throwOnNotFound : true })
    ).rejects.toThrow(/not found/i)
  })

  test('throws error for non-existent version (throw onNotFound : true)', async() => {
    await expect(
      view({ packageName : 'http-errors', version : '999.999.999', throwOnNotFound : true })
    ).rejects.toThrow(/no match found for version/i)
  })

  test('returns complete package data structure', async() => {
    const result = await view({ packageName : 'http-errors', version : '2.0.0' })

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
    const result = await view({ packageName : 'find-root' })

    expect(result).toBeDefined()
    expect(result.name).toBe('find-root')
  })

  describe('security - package name validation', () => {
    test('rejects shell injection attempts in package names', async() => {
      const maliciousPackages = [
        'package;rm -rf /',
        'package$(whoami)',
        'package`cat /etc/passwd`',
        'package|echo hacked',
        'package&&malicious'
      ]

      for (const malicious of maliciousPackages) {
        await expect(view({ packageName : malicious }))
          .rejects.toThrow(/shell metacharacters|Invalid package name/i)
      }
    })

    test('rejects path traversal attempts in package names', async() => {
      const maliciousPackages = [
        '../../../etc/passwd',
        '../../malicious',
        'package/../../../etc/hosts'
      ]

      for (const malicious of maliciousPackages) {
        await expect(view({ packageName : malicious }))
          .rejects.toThrow(/Invalid package name|invalid path characters/i)
      }
    })

    test('rejects shell injection in version parameter', async() => {
      const maliciousVersions = [
        '1.0.0;rm -rf /',
        '1.0.0$(whoami)',
        '1.0.0&&echo hacked'
      ]

      for (const malicious of maliciousVersions) {
        await expect(view({ packageName : 'http-errors', version : malicious }))
          .rejects.toThrow(/shell metacharacters/i)
      }
    })

    test('rejects reserved package names', async() => {
      const reserved = ['node_modules', 'package.json', 'favicon.ico']

      for (const name of reserved) {
        await expect(view({ packageName : name }))
          .rejects.toThrow(/reserved/i)
      }

      // '.' and '..' trigger different validation errors but are still rejected
      await expect(view({ packageName : '.' })).rejects.toThrow()
      await expect(view({ packageName : '..' })).rejects.toThrow()
    })
  })
})
