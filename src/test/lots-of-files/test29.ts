import test from '../../index.js'
import * as assert from 'assert'

const oneSecondMilliseconds = 1e3
const delayOneSecond = () => new Promise(resolve => setTimeout(resolve, oneSecondMilliseconds))

test('fast success', () => {})

test('fast failure', () => assert.equal(1, 2))

test('slow success', async () => {
    await delayOneSecond()
})

test('slow failure', async () => {
    await delayOneSecond()
    assert.equal(1, 2)
})
