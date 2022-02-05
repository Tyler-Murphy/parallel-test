/**
 * This file can be used to test `setTestSuiteOptions` manually, because these things are difficult to write automated tests for. You should see an error thrown by the second `setTestSuiteOptions` call.
 */

import { setTestSuiteOptions } from '../index.js'

setTestSuiteOptions({})
setTestSuiteOptions({})
