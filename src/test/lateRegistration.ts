import test from '../index'

setTimeout(() => test('too late to register', () => {}), 3000)
