// eslint-disable-next-line @typescript-eslint/no-require-imports -- require hook must patch CommonJS resolver before tests import TS aliases.
const Module = require("node:module")
// eslint-disable-next-line @typescript-eslint/no-require-imports -- require hook runs as CommonJS preload.
const path = require("node:path")

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function patchedResolveFilename(
  request,
  parent,
  isMain,
  options
) {
  if (request === "@renderer") {
    request = path.join(process.cwd(), "src/renderer/src")
  } else if (request.startsWith("@renderer/")) {
    request = path.join(
      process.cwd(),
      "src/renderer/src",
      request.slice("@renderer/".length)
    )
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}
