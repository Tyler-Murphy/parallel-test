This test runner runs all asynchronous tests concurrently, which can speed up tests if a test suite includes lots of tests that perform asynchronous operations.

I made this because I didn't find another runner that runs all tests at once.

### Usage

**As of v3.0.0, [ESM](https://nodejs.org/api/esm.html) is required**

An assertion library isn't included, so use whichever you'd like. I like to use node's `assert` library. If the errors thrown include `expected` and `actual` properties (like in the node `assert` library), a diff will be displayed.

A test ends when its code finishes running, or the promise it returns has settled.

TAP messages are printed, so feel free to use whichever TAP formatter you like. [Tape has a nice list.](https://github.com/substack/tape#pretty-reporters)

Tests must be registered synchronously after the first test is registered.

Events are emitted as tests run. The emitter is exported as `testEvents` from the main file. It's typed, so inspect its types to see which events are available.

For usage examples, see the [`src/test/`](./src/test/) directory.

### How to make tests safe to run with other tests

Many tests are written assuming that they'll run on their own, and won't interact with other tests, and as a result, aren't safe to run at the same time as each other. For example, a test that reads from a database might set up the test by writing a record, and then read the written record by assuming that its auto-generated sequential ID is `1`. If many tests are running concurrently, such assumptions aren't safe, and will result in test failures.

Generally, to write tests that are safe to run with other tests:
- Never use hard-coded identifiers or data that cannot be unique.
  - For example, rather than assuming that the record you wrote has ID `1`, ask the database to return the auto-generated ID when the record is created, and use it to retrieve the record later.
  - For example, if there's a unique constraint on email addresses, use randomly-generated addresses.
- If rate limits are a concern, make sure the operations your tests perform are rate limited, rather than relying on tests being rate limited.


### Future improvements

* a "watch" mode, in which:
  * The results of globbing are cached
  * The modules loaded are cached, and only added, removed, or updated as necessary
    * it might also be useful to have an option to re-run only the test files that were changed, for times when tests are being developed
* helpers for `beforeAll`, `afterAll`, `beforeEach`, `afterEach`. They might be implemented as functions that accept `test` and a callback, and returns a modified version of `test` that will run the hooks. There could be a separate function for each one, or a single `addHooks` function that accepts multiple hooks
