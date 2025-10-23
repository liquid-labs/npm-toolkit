/* global describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'

import * as semver from '@liquid-labs/semver-plus'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { getVersion } from '../get-version'
import { install } from '../install'
import { update } from '../update'
import { setupTestPackage } from './test-setup-lib'

describe('update', () => {
  test('updates all packages by default', async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors@1.2.0'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON.dependencies['http-errors']).toBe('^1.2.0')

    const { updated, actions, result } = await update({ projectPath : testPath })
    expect(updated).toBe(true)
    expect(actions.length).toBe(2) // update for 1.x and optional udpate to 2.x
    expect(actions[0]).toMatch(/http-errors/)
    expect(actions[0]).toMatch(/1\.8\.1/)

    const { npmVer } = await getVersion()
    if (semver.gte(npmVer, '11.0.0-0')) {
      const httpErrorsChangeEntry = result.change.filter(({ from }) => from.name === 'http-errors')[0]
      expect(httpErrorsChangeEntry.from.version).toBe('1.2.0')
      expect(httpErrorsChangeEntry.to.version).toBe('1.8.1')
    }
    else { // prior to npm v 11.0.0, the result was a lot less granular
      expect(result.changed).toBeGreaterThan(0)
    }

    const updateResult = tryExec(`cd ${testPath} && npm ls http-errors`)
    console.log('test G') // DEBUG
    expect(updateResult.code).toBe(0)
    expect(updateResult.stdout.includes('http-errors@1.8.1')).toBe(true)
  })

  describe('security - package name validation', () => {
    test('rejects shell injection attempts in package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec001' })
      const maliciousPackages = [
        'package;rm -rf /',
        'package$(whoami)',
        'package`cat /etc/passwd`',
        'package|echo hacked',
        'package&&malicious'
      ]

      for (const malicious of maliciousPackages) {
        await expect(update({
          packages    : [malicious],
          projectPath : testPath
        })).rejects.toThrow(/shell metacharacters|Invalid package name/i)
      }
    })

    test('rejects path traversal attempts in package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec002' })
      const maliciousPackages = [
        '../../../etc/passwd',
        '../../malicious',
        'package/../../../etc/hosts'
      ]

      for (const malicious of maliciousPackages) {
        await expect(update({
          packages    : [malicious],
          projectPath : testPath
        })).rejects.toThrow(/Invalid package name|invalid path characters/i)
      }
    })

    test('rejects shell injection attempts in projectPath', async() => {
      await expect(update({
        projectPath : '/tmp;rm -rf /'
      })).rejects.toThrow(/shell metacharacters/i)
    })

    test('rejects reserved package names', async() => {
      const { testPath } = await setupTestPackage({ pkgName : 'pkgSec003' })
      const reserved = ['node_modules', 'package.json', 'favicon.ico']

      for (const name of reserved) {
        await expect(update({
          packages    : [name],
          projectPath : testPath
        })).rejects.toThrow(/reserved/i)
      }

      // '.' and '..' trigger different validation errors but are still rejected
      await expect(update({ packages : ['.'], projectPath : testPath })).rejects.toThrow()
      await expect(update({ packages : ['..'], projectPath : testPath })).rejects.toThrow()
    })
  })
}, 30000) // update can take a bit; give it 30 seconds
