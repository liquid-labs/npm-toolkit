/* global describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { install } from '../install'

describe('install', () => {
  test('installs new packages', async() => {
    const testPath = fsPath.join(__dirname, 'pkgIn001')
    try {
      await fs.rm(testPath, { recursive : true })
    }
    catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    await fs.mkdir(testPath)
    tryExec(`cd ${testPath} && npm init -y`)
    install({ pkgs : ['http-errors'], targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(fsPath.join(testPath, 'package.json'), { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })

  test("'saveDev' switches package to devDependencies", async() => {
    const testPath = fsPath.join(__dirname, 'pkgIn001')
    install({ pkgs : ['http-errors'], saveDev : true, targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(fsPath.join(testPath, 'package.json'), { encoding : 'utf8' }))
    expect(pkgJSON?.devDependencies['http-errors']).toBeTruthy()
  })

  test("'saveProd' switches package to dependencies", async() => {
    const testPath = fsPath.join(__dirname, 'pkgIn001')
    install({ pkgs : ['http-errors'], saveProd : true, targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(fsPath.join(testPath, 'package.json'), { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })
})
