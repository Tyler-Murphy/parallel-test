import debugLog from './debugLog'
import * as variableDiff from 'variable-diff'

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

    await runTests()

    debugLog(`(${Date.now() - startTime} ms) done running tests`)

    process.exit(errorCount > 0 ? 1 : 0)
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
            writeOutput(`    error:`)
            writeOutput(`      message: ${error.message}`)
            writeOutput(`      expected: ${error.expected}`)
            writeOutput(`      actual: ${error.actual}`)
            writeOutput(`      diff: ${variableDiff(error.expected, error.actual).text}`)
            writeOutput(`      stack: ${cleanStack(error)}`)
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
    if (!stack) {
        return ''
    }

    if (typeof stack !== 'string') {
        return String(stack)
    }

    return stack  // todo: implement cleaning. There are libraries to do this.
}
