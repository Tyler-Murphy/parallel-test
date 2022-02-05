import test from '../index.js'

test('first test', () => {})

setTimeout(() => test('too late to register', () => {}), 3000)
