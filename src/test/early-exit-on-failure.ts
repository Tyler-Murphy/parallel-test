/**
 * Running this file manually should indicate that the the first test ran and succeeded, the second test ran and failed, and that there was an unfinished test (the third one)
 */

import test, { setTestSuiteOptions } from '../index'
import * as assert from 'assert'

setTestSuiteOptions({
    exitOnFailure: true,
})

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

test('first, succeeding test', async () => {
    await delay(0)
})

test('second, failing test', async () => {
    await delay(10)
    assert.fail('error')
})

test('third, succeeding test', async () => {
    await delay(20)
    assert.fail('error')
})
