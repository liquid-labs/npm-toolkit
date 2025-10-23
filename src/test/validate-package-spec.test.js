/* global beforeAll afterAll describe expect test */
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'
import { existsSync } from 'node:fs'

import { validatePackageSpec } from '../validate-package-spec'
import { validatePath } from '../lib/validate-path'
import { escapeShellArg } from '../lib/escape-shell-args'

describe('validatePackageSpec', () => {
  describe('npm package validation - throwIfInvalid mode', () => {
    test('accepts valid unscoped package names', () => {
      const validNames = [
        'valid-package',
        'package.name',
        'package_name',
        'package-name-123',
        'a',
        'my-package'
      ]

      for (const name of validNames) {
        expect(() => validatePackageSpec(name, { throwIfInvalid : true })).not.toThrow()
      }
    })

    test('accepts valid scoped package names', () => {
      const validNames = [
        '@scope/valid-package',
        '@liquid-labs/npm-toolkit',
        '@scope/package.name',
        '@scope/package_name',
        '@my-org/my-package'
      ]

      for (const name of validNames) {
        expect(() => validatePackageSpec(name, { throwIfInvalid : true })).not.toThrow()
      }
    })

    test('accepts valid package names with versions', () => {
      const validSpecs = [
        'package@1.0.0',
        'package@^1.0.0',
        'package@~1.0.0',
        '@scope/package@1.0.0',
        '@scope/package@^2.3.4',
        'package@latest',
        'package@next'
      ]

      for (const spec of validSpecs) {
        expect(() => validatePackageSpec(spec, { throwIfInvalid : true })).not.toThrow()
      }
    })

    test('rejects path traversal attempts with ../', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        './../../secret.txt',
        'package/../../../etc/hosts',
        '../../malicious'
      ]

      for (const maliciousName of maliciousNames) {
        expect(() => validatePackageSpec(maliciousName, { throwIfInvalid : true }))
          .toThrow(/Invalid package name|invalid path characters/i)
      }
    })

    test('rejects reserved system names', () => {
      const reservedNames = ['node_modules', 'package.json', 'favicon.ico']

      for (const reserved of reservedNames) {
        expect(() => validatePackageSpec(reserved, { throwIfInvalid : true }))
          .toThrow(/reserved/i)
      }

      // '.' and '..' are caught by path traversal check, but they're still rejected
      expect(() => validatePackageSpec('.', { throwIfInvalid : true })).toThrow()
      expect(() => validatePackageSpec('..', { throwIfInvalid : true })).toThrow()
    })

    test('rejects packages with shell metacharacters', () => {
      const invalidNames = [
        'package;rm -rf /',
        'package$(whoami)',
        'package`whoami`',
        'package|cat /etc/passwd',
        'package&& rm -rf /',
        'package || echo hacked',
        'package<script>',
        'package>output.txt',
        'package{expansion}',
        'package[glob]',
        'package!bang'
      ]

      for (const invalid of invalidNames) {
        expect(() => validatePackageSpec(invalid, { throwIfInvalid : true }))
          .toThrow(/shell metacharacters/i)
      }
    })

    test('rejects packages with backslashes', () => {
      const invalidNames = [
        'package\\with\\backslashes',
        'package\\\\double',
        '@scope\\package'
      ]

      for (const invalid of invalidNames) {
        expect(() => validatePackageSpec(invalid, { throwIfInvalid : true }))
          .toThrow(/invalid path characters|Invalid package name/i)
      }
    })

    test('rejects packages with newlines or other control characters', () => {
      const invalidNames = [
        'package\nwith\nnewlines',
        'package\rwith\rreturns'
      ]

      for (const invalid of invalidNames) {
        expect(() => validatePackageSpec(invalid, { throwIfInvalid : true }))
          .toThrow(/shell metacharacters/i)
      }

      // Tabs don't match shell metacharacters regex but will fail format validation
      expect(() => validatePackageSpec('package\twith\ttabs', { throwIfInvalid : true })).toThrow()
    })

    test('rejects null, undefined, or empty values', () => {
      expect(() => validatePackageSpec(null, { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
      expect(() => validatePackageSpec(undefined, { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
      expect(() => validatePackageSpec('', { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
      expect(() => validatePackageSpec('   ', { throwIfInvalid : true })).toThrow(/cannot be empty or whitespace/i)
    })

    test('rejects non-string values', () => {
      expect(() => validatePackageSpec(123, { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
      expect(() => validatePackageSpec({}, { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
      expect(() => validatePackageSpec([], { throwIfInvalid : true })).toThrow(/must be a non-empty string/i)
    })

    test('rejects package names that are too long', () => {
      const tooLong = 'a'.repeat(215)
      expect(() => validatePackageSpec(tooLong, { throwIfInvalid : true })).toThrow(/too long/i)
    })
  })

  describe('file: protocol package validation', () => {
    let testDir
    let testPackageDir
    let testTarballPath

    beforeAll(async() => {
      // Create test directory structure
      testDir = fsPath.join(__dirname, 'test-file-packages')
      testPackageDir = fsPath.join(testDir, 'valid-package')
      testTarballPath = fsPath.join(testDir, 'package.tgz')

      await fs.mkdir(testDir, { recursive : true })
      await fs.mkdir(testPackageDir, { recursive : true })
      await fs.writeFile(
        fsPath.join(testPackageDir, 'package.json'),
        JSON.stringify({ name : 'test-package', version : '1.0.0' })
      )
      // Create a dummy .tgz file
      await fs.writeFile(testTarballPath, 'dummy tarball content')
    })

    afterAll(async() => {
      // Clean up test directory
      if (existsSync(testDir)) {
        await fs.rm(testDir, { recursive : true, force : true })
      }
    })

    test('rejects file: packages when allowFilePackages is false', () => {
      expect(() => validatePackageSpec('file:../some-package', { throwIfInvalid : true }))
        .toThrow(/File protocol packages are not allowed/i)
      expect(() => validatePackageSpec('file:./package.tgz', { throwIfInvalid : true }))
        .toThrow(/File protocol packages are not allowed/i)
    })

    test('accepts file: packages with valid directory when allowFilePackages is true', () => {
      const fileSpec = `file:${testPackageDir}`
      expect(() => validatePackageSpec(fileSpec, { allowFilePackages : true, throwIfInvalid : true }))
        .not.toThrow()

      const result = validatePackageSpec(fileSpec, { allowFilePackages : true, throwIfInvalid : true })
      expect(result.isValid).toBe(true)
      expect(result.isFilePackage).toBe(true)
      expect(result.resolvedPath).toBeTruthy()
    })

    test('accepts file: packages with .tgz file when allowFilePackages is true', () => {
      const fileSpec = `file:${testTarballPath}`
      expect(() => validatePackageSpec(fileSpec, { allowFilePackages : true, throwIfInvalid : true }))
        .not.toThrow()

      const result = validatePackageSpec(fileSpec, { allowFilePackages : true, throwIfInvalid : true })
      expect(result.isValid).toBe(true)
      expect(result.isFilePackage).toBe(true)
    })

    test('accepts file: packages with relative paths containing ..', () => {
      // This is valid for file: protocol - we allow .. in file paths
      const relativeSpec = `file:${fsPath.relative(process.cwd(), testPackageDir)}`
      expect(() => validatePackageSpec(relativeSpec, { allowFilePackages : true, throwIfInvalid : true }))
        .not.toThrow()
    })

    test('rejects file: packages pointing to non-existent paths', () => {
      expect(() => validatePackageSpec('file:/non/existent/path', { allowFilePackages : true, throwIfInvalid : true }))
        .toThrow(/does not exist/i)
    })

    test('rejects file: packages with non-.tgz files', async() => {
      const txtFile = fsPath.join(testDir, 'test.txt')
      await fs.writeFile(txtFile, 'test')

      expect(() => validatePackageSpec(`file:${txtFile}`, { allowFilePackages : true, throwIfInvalid : true }))
        .toThrow(/must be a \.tgz or \.tar\.gz archive/i)
    })

    test('rejects file: packages with directory lacking package.json', async() => {
      const emptyDir = fsPath.join(testDir, 'empty-dir')
      await fs.mkdir(emptyDir, { recursive : true })

      expect(() => validatePackageSpec(`file:${emptyDir}`, { allowFilePackages : true, throwIfInvalid : true }))
        .toThrow(/must contain package\.json/i)

      await fs.rm(emptyDir, { recursive : true })
    })

    test('rejects file: packages with empty path', () => {
      expect(() => validatePackageSpec('file:', { allowFilePackages : true, throwIfInvalid : true }))
        .toThrow(/cannot be empty/i)
    })
  })
})

describe('validatePath', () => {
  test('accepts valid simple paths', () => {
    expect(() => validatePath('/valid/path')).not.toThrow()
    expect(() => validatePath('/home/user/project')).not.toThrow()
    expect(() => validatePath('relative/path')).not.toThrow()
  })

  test('rejects paths with shell metacharacters', () => {
    const dangerousPaths = [
      '/path;rm -rf /',
      '/path$(whoami)',
      '/path`command`',
      '/path|cat',
      '/path&& echo',
      '/path>file',
      '/path<input',
      '/path!bang'
    ]

    for (const path of dangerousPaths) {
      expect(() => validatePath(path)).toThrow(/shell metacharacters/i)
    }
  })

  test('rejects null, undefined, or empty paths', () => {
    expect(() => validatePath(null)).toThrow(/must be a non-empty string/i)
    expect(() => validatePath(undefined)).toThrow(/must be a non-empty string/i)
    expect(() => validatePath('')).toThrow(/must be a non-empty string/i)
    expect(() => validatePath('   ')).toThrow(/cannot be empty or whitespace/i)
  })

  test('validates path stays within basePath when provided', () => {
    const basePath = '/home/user/project'

    // Valid path within base
    expect(() => validatePath('subdir/file', basePath)).not.toThrow()

    // Path traversal attempt
    expect(() => validatePath('../../../etc/passwd', basePath))
      .toThrow(/Path traversal detected/i)
  })
})

describe('escapeShellArg', () => {
  test('wraps simple strings in single quotes', () => {
    expect(escapeShellArg('hello')).toBe("'hello'")
    expect(escapeShellArg('package-name')).toBe("'package-name'")
  })

  test('properly escapes single quotes within strings', () => {
    expect(escapeShellArg("it's")).toBe("'it'\\''s'")
    expect(escapeShellArg("don't")).toBe("'don'\\''t'")
  })

  test('escapes strings with shell metacharacters', () => {
    const dangerous = 'package; rm -rf /'
    const escaped = escapeShellArg(dangerous)
    expect(escaped).toBe("'package; rm -rf /'")
    // The semicolon and other chars are now safely inside single quotes
  })

  test('escapes strings with spaces', () => {
    expect(escapeShellArg('hello world')).toBe("'hello world'")
  })

  test('escapes complex strings safely', () => {
    const complex = "test'with\"quotes`and$vars"
    const escaped = escapeShellArg(complex)
    // Single quotes protect everything except single quotes themselves
    expect(escaped).toContain("'test")
    expect(escaped).toContain("quotes`and$vars'")
  })

  test('throws on non-string input', () => {
    expect(() => escapeShellArg(null)).toThrow(/requires a string/i)
    expect(() => escapeShellArg(undefined)).toThrow(/requires a string/i)
    expect(() => escapeShellArg(123)).toThrow(/requires a string/i)
  })
})

describe('validatePackageSpec - non-throwing mode (default)', () => {
  test('returns isValid: true for valid package names', () => {
    const result = validatePackageSpec('valid-package')
    expect(result.isValid).toBe(true)
    expect(result.errorMsg).toBeUndefined()
    expect(result.packageName).toBe('valid-package')
    expect(result.isFilePackage).toBe(false)
  })

  test('returns isValid: true for valid scoped packages', () => {
    const result = validatePackageSpec('@scope/package')
    expect(result.isValid).toBe(true)
    expect(result.packageName).toBe('@scope/package')
  })

  test('returns isValid: true for packages with versions', () => {
    const result = validatePackageSpec('package@1.0.0')
    expect(result.isValid).toBe(true)
    expect(result.packageName).toBe('package')
    expect(result.versionPart).toBe('1.0.0')
  })

  test('returns isValid: false for path traversal attempts', () => {
    const result = validatePackageSpec('../../../etc/passwd')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/invalid path characters/i)
  })

  test('returns isValid: false for shell injection attempts', () => {
    const result = validatePackageSpec('package;rm -rf /')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/shell metacharacters/i)
  })

  test('returns isValid: false for reserved names', () => {
    const result = validatePackageSpec('node_modules')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/reserved/i)
  })

  test('returns isValid: false for invalid format', () => {
    const result = validatePackageSpec('UPPERCASE')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/Invalid npm package name format/i)
  })

  test('returns isValid: false for null/undefined/empty', () => {
    let result = validatePackageSpec(null)
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/must be a non-empty string/i)

    result = validatePackageSpec(undefined)
    expect(result.isValid).toBe(false)

    result = validatePackageSpec('')
    expect(result.isValid).toBe(false)

    result = validatePackageSpec('   ')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/cannot be empty or whitespace/i)
  })

  test('returns isValid: false for file: packages when not allowed', () => {
    const result = validatePackageSpec('file:../some-package')
    expect(result.isValid).toBe(false)
    expect(result.errorMsg).toMatch(/File protocol packages are not allowed/i)
  })

  test('returns isValid: true for file: packages when allowed and valid', () => {
    const testPkg = fsPath.resolve(__dirname, '..', '..')
    const result = validatePackageSpec(`file:${testPkg}`, { allowFilePackages : true })
    expect(result.isValid).toBe(true)
    expect(result.isFilePackage).toBe(true)
    expect(result.resolvedPath).toBeTruthy()
  })

  test('guarantees errorMsg is set when isValid is false', () => {
    const invalidCases = [
      null,
      undefined,
      '',
      '../../../etc/passwd',
      'package;rm -rf /',
      'package$(whoami)',
      'node_modules',
      'UPPERCASE',
      'file:../pkg' // without allowFilePackages
    ]

    for (const invalidCase of invalidCases) {
      const result = validatePackageSpec(invalidCase)
      expect(result.isValid).toBe(false)
      expect(result.errorMsg).toBeDefined()
      expect(typeof result.errorMsg).toBe('string')
      expect(result.errorMsg.length).toBeGreaterThan(0)
    }
  })
})
