import debugLog from './debugLog.js'
import cleanErrorStack from 'clean-stack'
import getStackOnly from 'extract-stack'
import * as util from 'util'
import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'

const tests: Array<Test> = []
let successCount = 0
let errorCount = 0
let testsRunning = false
/** This can be set to true by any situation that causes the test run to exit early, before all the tests have run, like a suite timeout, or an early exit due to an error. */
let exitedEarly = false
const writeOutput = (line: string) => console.log(line)
let testSuiteOptions: TestSuiteOptions = {
    maximumDurationSeconds: 3600,
    exitOnFailure: false,
}
let testSuiteOptionsHaveBeenSet = false
const testEvents = new EventEmitter() as TypedEmitter<{
    testRegistered: () => void,
    suiteLoading: () => void,
    suiteLoaded: () => void,
    suiteFinished: () => void,
    testError: (test: Test, error: Error) => void,
}>


interface Test {
    description: string,
    testFunction: () => Promise<void> | void,
}

interface TestSuiteOptions {
    /**
     * The maximum amount of time that tests in the suite are allowed to run. Defaults to `3600`.
     *
     * If, at the end of this time, tests are still running
     *      If there were any failures, exit with a failure
     *      If there were no failures, exit with a success
     */
    maximumDurationSeconds: number,

    /**
     * Whether to exit immediately when a test fails. Defaults to `true`.
     *
     * If the value is `true`, when a test fails, the rest of the test run will be canceled.
     * If the value is `false`, when a test fails, the rest of the test run will continue.
     */
    exitOnFailure: boolean
}

export default test
export {
    setTestSuiteOptions,
    testEvents,
}

function test(description: Test['description'], testFunction: Test['testFunction']): void {
    if (testsRunning) {
        throw new Error(`Failed to register "${description}". Tests are already running, so it's not possible to register a new test. Tests must be defined synchronously after the first test is defined.`)
    }

    if (/^\d/.test(description)) {
        // this is part of the TAP specification, to avoid ambiguity with other types of messages the specification defines
        throw new Error(`Test descriptions cannot start with a number: "${description}"`)
    }

    const test = {
        description,
        testFunction
    }

    debugLog('registering test', test)

    tests.push(test)

    setImmediate(() => testEvents.emit(`suiteLoaded`))
}

function setTestSuiteOptions(newOptions: Partial<TestSuiteOptions>): void {
    if (testsRunning) {
        throw new Error(`Cannot set test suite options once tests are already running`)
    }

    if (testSuiteOptionsHaveBeenSet) {
        throw new Error(`Can only set test suite options once`)
    }

    testSuiteOptionsHaveBeenSet = true

    testSuiteOptions = {
        ...testSuiteOptions,
        ...newOptions,
    }
}

async function runTests(options: TestSuiteOptions): Promise<void> {
    debugLog(`running test suite with options ${JSON.stringify(options)}`)

    writeOutput('TAP version 13')
    writeOutput(`1..${tests.length}`)

    const pendingTests = tests.map(async test => {
        const startTime = Date.now()
        debugLog(`running test "${test.description}"`)

        try {
            await test.testFunction()

            if (exitedEarly) {
                return debugLog(`test ${test.description} finished after early exit... suppressing success output`)
            }

            writeOutput(`ok ${test.description}`)
            successCount += 1
        } catch(error) {
            if (exitedEarly) {
                return debugLog(`test ${test.description} finished after early exit... suppressing error output: ${error.message}`)
            }

            errorCount += 1
            testEvents.emit('testError', test, error)

            writeOutput(`not ok ${test.description}`)
            writeOutput(`  ---`)
            writeOutput(`  message: ${error.message}`)
            writeOutput(`  expected: ${util.inspect(error.expected)}`)
            writeOutput(`  actual: ${util.inspect(error.actual)}`)
            writeOutput(`  stack: ${cleanStack(error)}`)
            writeOutput(`  ...`)
        } finally {
            debugLog(`(${Date.now() - startTime} ms) done running test "${test.description}"`)
        }
    })

    const pendingSuiteTimeout = new Promise<void>(resolve => {
        setTimeout(() => {
            writeOutput(`# reached ${options.maximumDurationSeconds} seconds, the configured maximumDurationSeconds, timing out`)
            exitedEarly = true
            resolve()
        }, options.maximumDurationSeconds * 1e3)
        .unref()  // make sure this doesn't prevent tests from exiting if it's the only pending operation
    })

    /** This is used to exit early if early exits due to failures are enabled and there's an error */
    const pendingTestError = new Promise<void>(resolve => {
        if (options.exitOnFailure) {
            testEvents.once('testError', () => {
                writeOutput(`# exiting early because a test failed and early exits are enabled`)
                exitedEarly = true
                resolve()
            })
        }
    })

    await Promise.race([
        Promise.all(pendingTests),
        pendingSuiteTimeout,
        pendingTestError,
    ])

    writeOutput(`# tests ${tests.length}`)
    writeOutput(`# pass ${successCount}`)
    writeOutput(`# fail ${errorCount}`)
    writeOutput(`# unfinished ${tests.length - successCount - errorCount}`)
}

function cleanStack({ stack }: { stack: string }): string {
    return getStackOnly(
        cleanErrorStack(stack, {
            pretty: true
        })
    )
}

async function runTestsAndHandleExiting() {
    if (testsRunning) {
        throw new Error(`Tests are already running. Can't run again.`)
    }

    const startTime = Date.now()
    debugLog('running tests')

    testsRunning = true
    await runTests(testSuiteOptions)

    debugLog(`(${Date.now() - startTime} ms) done running tests`)
    testEvents.emit('suiteFinished')

    process.exitCode = errorCount > 0 ? 1 : 0

    if (exitedEarly) {
        // We need to forcefully end the process so that remaining tests end, and don't keep the process alive.
        debugLog(`Sending kill signal SIGINT to self (process ID ${process.pid}) because the test suite is exiting early. There are ${process.listenerCount(`SIGINT`)} current listeners for this signal.`)
        process.kill(process.pid, `SIGINT`)  // exit the process, but allow handlers to catch the `SIGINT` and clean up as necessary. This is a gentler alternative to `process.exit()`.
    }
}

testEvents.once(`testRegistered`, runTestsAndHandleExiting) // Make sure tests run if a test module is run directly
testEvents.once(`suiteLoading`, () => testEvents.removeListener(`testRegistered`, runTestsAndHandleExiting)) // If tests are being loaded via `test-all`, make sure test registration in test modules doesn't trigger test runs, since we need to wait for all modules to be loaded by `test-all`
testEvents.once(`suiteLoaded`, runTestsAndHandleExiting)
