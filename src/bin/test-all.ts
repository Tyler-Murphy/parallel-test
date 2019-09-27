#!/usr/bin/env node

import * as program from 'commander'
import glob = require('tiny-glob')
import debugLog from '../debugLog'
import { resolve as resolvePath } from 'path'

program
.option('--maximumDurationSeconds <maximumDurationSeconds>', 'The maximum amount of time that tests in the suite are allowed to run. Defaults to `3600`')
.option('--path <path>', 'The path to the test file(s) to run. Can be a glob pattern to run many at once. Can be repeated, e.g., --path path1 --path path2', (newPath, existingPaths) => [...existingPaths, newPath], [])

program.parse(process.argv)

const paths: Array<string> = program.path
const startTime = Date.now()

if (paths.length === 0) {
  throw new Error('Paths must be provided')
}

debugLog('finding matches for', paths)

Promise.all(paths.map(path => glob(path)))
.then(matchGroups => {
  debugLog(`(${Date.now() - startTime} ms) found matches:`, matchGroups)

  matchGroups.forEach(matches => {
    matches.forEach(match => {
      const startTime = Date.now()

      require(resolvePath(process.cwd(), match))
      debugLog(`(${Date.now() - startTime} ms) loaded ${match}`)
    })
  })

  /**
   * We load ../index here, instead of at the top of the file, because it must be loaded in the same synchronous chunk of code as test registration (caused by the `require` just above here).
   * If we were to load `index` asynchronously **before** registering tests, the `setImmediate` in `index` would run the currently-registered tests (none of them) before any could be registered. The test process would exit without running any tests.
   * If we were to load `index` asynchronously **after** registering tests, we wouldn't be able to set options, because the test run would have started, and options aren't allowed to be set once the test run has begun.
   */
  const setTestSuiteOptions = require('../index').setTestSuiteOptions  // import late so that we don't trigger test runs by loading the module and causing its `setImmediate` to run and start the tests

  setTestSuiteOptions({
    ...(program.maximumDurationSeconds && { maximumDurationSeconds: program.maximumDurationSeconds })
  })
})
