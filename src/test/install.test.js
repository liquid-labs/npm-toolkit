/* global describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { install } from '../install'
import { setupTestPackage } from './test-setup-lib'

describe('install', () => {
  test('installs new packages', async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })

  // expects to be executed serially with the previous test
  test("'saveDev' switches package to devDependencies", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ noReset : true, pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors'], saveDev : true, projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.devDependencies['http-errors']).toBeTruthy()
  })

  // expects to be executed seriallly with the previous test
  test("'saveProd' switches package to dependencies", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ noReset : true, pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors'], saveProd : true, projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })

  test("will install packages from 'devPaths' when present", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ noReset : true, pkgName : 'pkgIn001' })
    const devPaths = [fsPath.resolve(__dirname, '..', '..')]

    await install({ devPaths, packages : ['@liquid-labs/npm-toolkit'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['@liquid-labs/npm-toolkit']).toMatch(/^file:/)
  })

  test('can specify version as part of package', async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors@latest'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })

  describe('security - package name validation', () => {
    test('rejects path traversal attempts in package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec001' })
      const maliciousPackages = [
        '../../../etc/passwd',
        '../../malicious',
        'package/../../../etc/hosts'
      ]

      for (const malicious of maliciousPackages) {
        await expect(install({
          packages    : [malicious],
          projectPath : testPath
        })).rejects.toThrow(/Invalid package name|invalid path characters/i)
      }
    })

    test('rejects shell injection attempts in package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec002' })
      const maliciousPackages = [
        'package;rm -rf /',
        'package$(whoami)',
        'package`cat /etc/passwd`',
        'package|echo hacked',
        'package&&malicious'
      ]

      for (const malicious of maliciousPackages) {
        await expect(install({
          packages    : [malicious],
          projectPath : testPath
        })).rejects.toThrow(/shell metacharacters|Invalid package name/i)
      }
    })

    test('rejects shell injection attempts in projectPath', async() => {
      await expect(install({
        packages    : ['http-errors'],
        projectPath : '/tmp;rm -rf /'
      })).rejects.toThrow(/shell metacharacters/i)
    })

    test('rejects reserved package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec003' })
      const reserved = ['node_modules', 'package.json', 'favicon.ico']

      for (const name of reserved) {
        await expect(install({
          packages    : [name],
          projectPath : testPath
        })).rejects.toThrow(/reserved/i)
      }

      // '.' and '..' trigger different validation errors but are still rejected
      await expect(install({ packages : ['.'], projectPath : testPath })).rejects.toThrow()
      await expect(install({ packages : ['..'], projectPath : testPath })).rejects.toThrow()
    })
  })

  describe('security - file: protocol packages', () => {
    test('rejects file: packages by default', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgFile001' })

      await expect(install({
        packages    : ['file:../some-package'],
        projectPath : testPath
      })).rejects.toThrow(/File protocol packages are not allowed/i)
    })

    test('accepts file: packages when allowFilePackages is true', async() => {
      const localPkg = fsPath.resolve(__dirname, '..', '..')

      // This should not throw (though it may fail for other reasons like actual npm install)
      // We're just testing that validation passes
      expect(() => {
        const packages = [`file:${localPkg}`]
        // Just validate, don't actually run install to avoid side effects
        const { validatePackageSpec } = require('../validate-package-spec')
        for (const pkg of packages) {
          validatePackageSpec(pkg, { allowFilePackages : true })
        }
      }).not.toThrow()
    })
  })
})
