This test runner runs all asynchronous tests concurrently, which can speed up tests if a test suite includes lots of tests that perform asynchronous operations.

I made this because I didn't find a runner that runs all tests at once, and was easy for me to understand and extend.

### Usage

An assertion library isn't included, so use whichever you'd like. If the errors thrown include `expected` and `actual` properties (like in the node core `assert` library), a diff will be displayed.

A test ends when its code finishes running, or the promise it returns has settled.

TAP messages are printed, so feel free to use whichever TAP formatter you like. [Tape has a nice list.](https://github.com/substack/tape#pretty-reporters)

Tests must be defined synchronously.

Events are emitted as tests run. The emitter is exported as `testEvents` from the main file. It's typed, so inspect its types to see which events are available.

For usage examples, see the [`src/test/`](./src/test/) directory.

### Future improvements

* a mode where tests are run sequentially, and the memory usage of each test is recorded. Then, use the recorded memory usage to run only as many tests as are supported by the available memory.
* a "watch" mode, in which:
  * The results of globbing are cached
  * The modules loaded are cached, and only added, removed, or updated as necessary
    * it might also be useful to have an option to re-run only the test files that were changed, for times when tests are being developed
* helpers for `beforeAll`, `afterAll`, `beforeEach`, `afterEach`. They might be implemented as functions that accept `test` and a callback, and returns a modified version of `test` that will run the hooks. There could be a separate function for each one, or a single `addHooks` function that accepts multiple hooks
