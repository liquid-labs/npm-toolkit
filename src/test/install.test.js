/* global describe expect test */
// these tests must be executed serially
import * as fs from 'node:fs/promises'

import { install } from '../install'
import { setupTestPackage } from './test-setup-lib'

describe('install', () => {
  test('installs new packages', async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    install({ pkgs : ['http-errors'], targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })

  // expects to be executed serially with the previous test
  test("'saveDev' switches package to devDependencies", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ noReset : true, pkgName : 'pkgIn001' })

    install({ pkgs : ['http-errors'], saveDev : true, targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.devDependencies['http-errors']).toBeTruthy()
  })

  // expects to be executed seriallly with the previous test
  test("'saveProd' switches package to dependencies", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ noReset : true, pkgName : 'pkgIn001' })

    install({ pkgs : ['http-errors'], saveProd : true, targetPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })
})
