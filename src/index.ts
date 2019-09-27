import debugLog from './debugLog'
import * as cleanErrorStack from 'clean-stack'
import * as getStackOnly from 'extract-stack'
import * as util from 'util'

const tests: Array<Test> = []
let successCount = 0
let errorCount = 0
let testsRunning = false
let testsTimedOut = false
const writeOutput = (line: string) => console.log(line)
let testSuiteOptions: TestSuiteOptions = {
    maximumDurationSeconds: 3600,
}
let testSuiteOptionsHaveBeenSet = false

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
}

export default test
export {
    setTestSuiteOptions
}

function test(description: Test['description'], testFunction: Test['testFunction']): void {
    if (testsRunning) {
        throw new Error(`Failed to register "${description}". Tests are already running, so it's not possible to register a new test. Tests must be defined synchronously.`)
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

// Run tests after synchronous test definitions happen. This means that tests MUST be defined synchronously.
setImmediate(async () => {
    const startTime = Date.now()
    debugLog('running tests')

    testsRunning = true
    await runTests(testSuiteOptions)

    debugLog(`(${Date.now() - startTime} ms) done running tests`)

    process.exitCode = errorCount > 0 ? 1 : 0

    if (testsTimedOut) {
        // At this point, all tests that fit into the timeout are done running and all results have been reported. We need to forcefully end the process so that remaining tests that are taking too long to run end, and don't keep the process alive.
        debugLog(`Sending kill signal SIGINT to self (process ID ${process.pid}) because tests timed out. There are ${process.listenerCount(`SIGINT`)} current listeners for this signal.`)
        process.kill(process.pid, `SIGINT`)  // exit the process, but allow handlers to catch the `SIGINT` and clean up as necessary. This is a gentler alternative to `process.exit()`.
    }
})

async function runTests(options: TestSuiteOptions): Promise<void> {
    debugLog(`running test suite with options ${JSON.stringify(options)}`)

    writeOutput('TAP version 13')
    writeOutput(`1..${tests.length}`)

    const pendingTests = tests.map(async test => {
        const startTime = Date.now()
        debugLog(`running test "${test.description}"`)

        try {
            await test.testFunction()
            writeOutput(`ok ${test.description}`)
            successCount += 1
        } catch(error) {
            errorCount += 1

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

    const pendingSuiteTimeout = new Promise(resolve => {
        setTimeout(() => {
            writeOutput(`# reached ${options.maximumDurationSeconds} seconds, the configured maximumDurationSeconds, timing out`)
            testsTimedOut = true
            resolve()
        }, options.maximumDurationSeconds * 1e3)
        .unref()  // make sure this doesn't prevent tests from exiting if it's the only pending operation
    })

    await Promise.race([
        Promise.all(pendingTests),
        pendingSuiteTimeout,
    ])

    writeOutput(`# tests ${tests.length}`)
    writeOutput(`# pass ${successCount}`)
    writeOutput(`# fail ${errorCount}`)
    writeOutput(`# skipped ${tests.length - successCount - errorCount}`)
}

function cleanStack({ stack }: { stack: string }): string {
    return getStackOnly(
        cleanErrorStack(stack, {
            pretty: true
        })
    )
}
