import debugLog from './debugLog'
import * as cleanErrorStack from 'clean-stack'
import * as getStackOnly from 'extract-stack'
import * as util from 'util'

const tests: Array<Test> = []
let errorCount = 0
let testsRunning = false
const writeOutput = (line: string) => process.stdout.write(line + '\n')

interface Test {
    description: string,
    testFunction: () => Promise<void> | void,
}

export default test

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

// Run tests after synchronous test definitions happen. This means that tests MUST be defined synchronously.
setImmediate(async () => {
    const startTime = Date.now()
    debugLog('running tests')

    testsRunning = true
    await runTests()

    debugLog(`(${Date.now() - startTime} ms) done running tests`)

    process.exitCode = errorCount > 0 ? 1 : 0
})

async function runTests(): Promise<void> {
    writeOutput('TAP version 13')
    writeOutput(`1..${tests.length}`)

    const pendingTests = tests.map(async test => {
        const startTime = Date.now()
        debugLog(`running test "${test.description}"`)

        try {
            await test.testFunction()
            writeOutput(`ok ${test.description}`)
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

    await Promise.all(pendingTests)

    writeOutput(`# tests ${tests.length}`)
    writeOutput(`# pass ${tests.length - errorCount}`)
    writeOutput(`# fail ${errorCount}`)
}

function cleanStack({ stack }: { stack: string }): string {
    return getStackOnly(
        cleanErrorStack(stack, {
            pretty: true
        })
    )
}
