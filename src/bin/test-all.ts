#!/usr/bin/env node

import { Command } from 'commander'
import glob from 'tiny-glob'
import debugLog from '../debugLog.js'
import { resolve as resolvePath } from 'path'
import { testEvents, setTestSuiteOptions } from '../index.js'

testEvents.emit(`suiteLoading`)

const program = new Command()

program
.option('--maximumDurationSeconds <maximumDurationSeconds>', 'The maximum amount of time that tests in the suite are allowed to run. Defaults to `3600`')
.option('--exitOnFailure', 'Exit immediately if a test fails, rather than continuing to run the rest of the tests')
.option('--path <path>', 'The path to the test file(s) to run. Can be a glob pattern to run many at once. Can be repeated, e.g., --path path1 --path path2', (newPath, existingPaths) => [...existingPaths, newPath], [])

program.parse(process.argv)

const options = program.opts()

setTestSuiteOptions({
  ...(options.maximumDurationSeconds && { maximumDurationSeconds: options.maximumDurationSeconds }),
  ...(options.exitOnFailure && { exitOnFailure: options.exitOnFailure }),
})

const paths: Array<string> = options.path
const startTime = Date.now()

if (paths.length === 0) {
  throw new Error('Paths must be provided')
}

debugLog('finding matches for', paths)

const matches = (await Promise.all(paths.map(path => glob(path)))).flat()

debugLog(`(${Date.now() - startTime} ms) found matches:`, matches)

await Promise.all(
  matches.map(async match => {
    const startTime = Date.now()

    debugLog(`Starting load ${match}`)
    await import(resolvePath(process.cwd(), match))
    debugLog(`(${Date.now() - startTime} ms) loaded ${match}`)
  })
)

testEvents.emit(`suiteLoaded`)
