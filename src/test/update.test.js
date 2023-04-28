/* global describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { install } from '../install'
import { update } from '../update'
import { setupTestPackage } from './test-setup-lib'

describe('update', () => {
  test('updates all packages by default', async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    install({ pkgs : ['http-errors'], targetPath : testPath, version : '1.2.0' })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    pkgJSON.dependencies['http-errors'] = '^1.2.0'

    update({ targetPath : testPath })
    const updateResult = tryExec(`cd ${testPath} && npm ls http-errors`)
    expect(updateResult.code).toBe(0)
    expect(updateResult.stdout.includes('http-errors@1.8.1')).toBe(true)
  })
})
