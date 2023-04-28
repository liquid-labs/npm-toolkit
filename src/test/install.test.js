/* global beforeAll describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { install } from '../install'

describe('install', () => {
  test("installs new packages", async () => {
    const testPath = fsPath.join(__dirname, 'pkgIn001')
    try {
      await fs.rm(testPath, { recursive: true })
    }
    catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    await fs.mkdir(testPath)
    tryExec(`cd ${testPath} && npm init -y`)
    install({ pkgs: [ 'http-errors' ], targetPath: testPath })
    const pkgJSON = JSON.parse(await fs.readFile(fsPath.join(testPath, 'package.json'), { encoding: 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })
})
