import test from '../index'
import * as assert from 'assert'

test('nice diff', () => assert.equal('hello', 'hallo'))
test('nice diff', () => assert.deepStrictEqual(
    new Set(['a', 'b']),
    new Set(['a'])
))
