const Module = require('module')
const path = require('path')

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (request === '@renderer') {
    request = path.join(process.cwd(), 'src/renderer/src')
  } else if (request.startsWith('@renderer/')) {
    request = path.join(process.cwd(), 'src/renderer/src', request.slice('@renderer/'.length))
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}
