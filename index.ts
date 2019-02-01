// add a mode where tests run sequentially and the amount of memory each one uses is recorded. Then, use the recorded memory usage to make sure memory doesn't run out when running tests concurrently.
// add a runner to run a bunch of test files at once IN THE SAME PROCESS based on a glob pattern. There's probably a library to do it. If not, this can be modified from ~/code/send/node_modules/painless/bin/painless

const tests: Array<Test> = []
let errorCount = 0
let testsRunning = false
const writeOutput = (line: string) => process.stdout.write(line + '\n')

interface Test {
    description: string,
    testFunction: () => Promise<void> | void,
}

export default test

function test(description: Test['description'], testFunction: Test['testFunction']) {
    if (testsRunning) {
        throw new Error(`Failed to register "${description}". Tests are already running, so it's not possible to register a new test. Tests must be defined synchronously.`)
    }

    tests.push({
        description,
        testFunction
    })
}

// Run tests after synchronous test definitions happen. This means that tests MUST be defined synchronously.
setImmediate(() => {
    runTests()
    .then(() => process.exit(errorCount > 0 ? 1 : 0))
})

async function runTests(): Promise<void> {
    writeOutput('TAP version 13')

    const pendingTests = tests.map(async test => {
        try {
            await test.testFunction()
            writeOutput(`ok  ${test.description}`)
        } catch(error) {
            writeOutput(`not ok  ${test.description}`)
            writeOutput(`  ---`)
            writeOutput(`    error:`)
            writeOutput(`      message: ${error.message}`)
            writeOutput(`      diff: ${diff(error)}`)
            writeOutput(`      stack: ${cleanStack(error)}`)
            writeOutput(`  ...`)
        }
    })

    await Promise.all(pendingTests)

    writeOutput(`1..${tests.length}`)
    writeOutput(`# tests ${tests.length}`)
    writeOutput(`# pass ${tests.length - errorCount}`)
    writeOutput(`# fail ${errorCount}`)
    writeOutput(`# ${errorCount === 0 ? 'passed' : 'failed'}!`)  // todo: check if this is part of the TAP specification
}

function diff({ expected, actual }): string {
    if (!expected || !actual) {
        return ''
    }

    return `need to implement diffing`  // todo: implement. There are libraries.
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
