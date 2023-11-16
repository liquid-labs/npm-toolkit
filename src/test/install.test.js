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

  test("can specify version as part of package", async() => {
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })

    await install({ packages : ['http-errors@latest'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    expect(pkgJSON?.dependencies['http-errors']).toBeTruthy()
  })
})
