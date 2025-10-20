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
    console.log('test A') // DEBUG
    const { pkgPath, testPath } = await setupTestPackage({ pkgName : 'pkgIn001' })
    console.log('test B') // DEBUG

    await install({ packages : ['http-errors@1.2.0'], projectPath : testPath })
    console.log('test C') // DEBUG
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    console.log('test D') // DEBUG
    expect(pkgJSON.dependencies['http-errors']).toBe('^1.2.0')

    const { updated, actions, result } = await update({ projectPath : testPath })
    console.log('test F') // DEBUG
    expect(updated).toBe(true)
    expect(actions.length).toBe(2) // update for 1.x and optional udpate to 2.x
    expect(actions[0]).toMatch(/http-errors/)
    expect(actions[0]).toMatch(/1\.8\.1/)

    const { npmVer } = await getVersion()
    if (semver.gte(npmVer, '11.0.0-0')) {
      console.log('test G-1') // DEBUG
      const httpErrorsChangeEntry = result.change.filter(({ from }) => from.name === 'http-errors')[0]
      expect(httpErrorsChangeEntry.from.version).toBe('1.2.0')
      expect(httpErrorsChangeEntry.to.version).toBe('1.8.1')
    }
    else console.log('test G-2') // DEBUG

    const updateResult = tryExec(`cd ${testPath} && npm ls http-errors`)
    console.log('test G') // DEBUG
    expect(updateResult.code).toBe(0)
    expect(updateResult.stdout.includes('http-errors@1.8.1')).toBe(true)
  })
}, 30000) // update can take a bit; give it 30 seconds
