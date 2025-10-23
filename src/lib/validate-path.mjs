import * as fsPath from 'node:path'
import createError from 'http-errors'

/**
 * Validates a file system path for safety (prevents path traversal attacks)
 *
 * @private
 * @param {string} path - The file system path to validate
 * @param {string} [basePath] - Optional base path that the validated path must be within
 * @throws {Error} If the path is invalid or potentially dangerous
 */
const validatePath = (path, basePath) => {
  if (!path || typeof path !== 'string') {
    throw createError(400, 'Path must be a non-empty string', { expose : true })
  }

  const trimmedPath = path.trim()
  if (trimmedPath.length === 0) {
    throw createError(400, 'Path cannot be empty or whitespace', { expose : true })
  }

  // Check for shell metacharacters
  const dangerousChars = /[;&|`$(){}[\]<>!*?~\n\r]/
  if (dangerousChars.test(trimmedPath)) {
    throw createError(400, 'Path contains shell metacharacters', { expose : true })
  }

  // If basePath is provided, ensure the resolved path stays within it
  if (basePath) {
    const normalizedBase = fsPath.resolve(basePath)
    const normalizedPath = fsPath.resolve(basePath, trimmedPath)

    if (!normalizedPath.startsWith(normalizedBase)) {
      throw createError(400, 'Path traversal detected', { expose : true })
    }
  }

  return trimmedPath
}

export { validatePath }
