This test runner runs all asynchronous tests concurrently, which can speed up tests if a test suite includes lots of tests that perform asynchronous operations.

### Usage

### Future improvements

* a mode where tests are run sequentially, and the memory usage of each test is recorded. Then, use the recorded memory usage to run only as many tests as are supported by the available memory.
* a "watch" mode, in which:
  * The results of globbing are cached
  * The modules loaded are cached, and only added, removed, or updated as necessary
    * it might also be useful to have an option to re-run only the test files that were changed, for times when tests are being developed
* helpers for `beforeAll`, `afterAll`, `beforeEach`, `afterEach`. They might be implemented as functions that accept `test` and a callback, and returns a modified version of `test` that will run the hooks. There could be a separate function for each one, or a single `addHooks` function that accepts multiple hooks
