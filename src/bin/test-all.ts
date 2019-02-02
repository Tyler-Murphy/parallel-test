import glob = require('tiny-glob')
import debugLog from '../debugLog'
import { resolve as resolvePath } from 'path'

const paths = process.argv.slice(2)
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
})
