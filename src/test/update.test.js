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

    await install({ packages : ['http-errors@1.2.0'], projectPath : testPath })
    const pkgJSON = JSON.parse(await fs.readFile(pkgPath, { encoding : 'utf8' }))
    pkgJSON.dependencies['http-errors'] = '^1.2.0'

    const { updated, actions, result } = await update({ projectPath : testPath })
    expect(updated).toBe(true)
    expect(actions.length).toBe(2) // update for 1.x and optional udpate to 2.x
    expect(actions[0]).toMatch(/http-errors/)
    expect(actions[0]).toMatch(/1\.8\.1/)
    const httpErrorsChangeEntry = result.change.filter(({ from }) => from.name === 'http-errors')[0]
    expect(httpErrorsChangeEntry.from.version).toBe('1.2.0')
    expect(httpErrorsChangeEntry.to.version).toBe('1.8.1')

    const updateResult = tryExec(`cd ${testPath} && npm ls http-errors`)
    expect(updateResult.code).toBe(0)
    expect(updateResult.stdout.includes('http-errors@1.8.1')).toBe(true)
  })
})
