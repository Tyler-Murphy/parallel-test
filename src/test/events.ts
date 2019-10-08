/**
 * Running this file manually should log a message when the tests are done
 */

import test, { testEvents } from '../index'
import * as assert from 'assert'

test('fast success', () => {})

test('fast failure', () => assert.equal(1, 2))

testEvents.on('suiteFinished', () => console.log('received event indicating test suite has finished running'))
