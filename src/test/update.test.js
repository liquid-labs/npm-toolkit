/* global beforeAll describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { install } from '../install'
import { update } from '../update'

describe('update', () => {
  test("updates all packages by default", async () => {
    const testPath = fsPath.join(__dirname, 'pkgUp001')
    try {
      await fs.rm(testPath, { recursive: true })
    }
    catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    await fs.mkdir(testPath)
    tryExec(`cd ${testPath} && npm init -y`)
    install({ pkgs: [ 'http-errors' ], targetPath: testPath, version: '1.2.0' })
    const pkgJSON = JSON.parse(await fs.readFile(fsPath.join(testPath, 'package.json'), { encoding: 'utf8' }))
    pkgJSON.dependencies['http-errors'] = '^1.2.0'
    update({ targetPath: testPath })
    const updateResult = tryExec(`cd ${testPath} && npm ls http-errors`)
    expect(updateResult.code).toBe(0)
    expect(updateResult.stdout.includes('http-errors@1.8.1')).toBe(true)
  })
})
