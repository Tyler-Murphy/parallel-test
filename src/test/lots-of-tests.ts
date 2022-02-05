import test from '../index.js'
import * as assert from 'assert'

const randomDelay = () => new Promise(resolve => setTimeout(resolve, Math.round(Math.random() * 1e3)))
const failOnePercentOfTheTime = () => assert.notEqual(100, Math.ceil(Math.random() * 100))

for (let i = 0; i < 1e5; i += 1) {
    test(`random delay ${i}`, async () => {
        await randomDelay()
        failOnePercentOfTheTime()
    })
}
