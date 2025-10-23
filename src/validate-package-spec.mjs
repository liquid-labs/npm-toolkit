import * as fsPath from 'node:path'
import { existsSync, statSync } from 'node:fs'
import createError from 'http-errors'

/**
 * Validates that a package specification is safe for use in shell commands and file operations.
 * Supports standard npm package specs and file: protocol packages when allowFilePackages is true.
 *
 * @param {string} packageSpec - The package specification to validate (e.g., 'package@1.0.0', '@scope/pkg', 'file:../pkg')
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.allowFilePackages=false] - Whether to allow 'file:' protocol package specs
 * @param {boolean} [options.throwIfInvalid=false] - If true, throws an error on validation failure. If false, returns result object with isValid=false.
 * @throws {Error} If throwIfInvalid is true and the package spec is invalid or potentially dangerous
 * @returns {Object} Validation result with { isValid: boolean, errorMsg?: string, isFilePackage?: boolean, cleanSpec?: string, packageName?: string, versionPart?: string, resolvedPath?: string }
 */
const validatePackageSpec = (packageSpec, { allowFilePackages = false, throwIfInvalid = false } = {}) => {
  // Helper function to handle errors based on throwIfInvalid option
  const handleError = (message) => {
    if (throwIfInvalid) {
      throw createError(400, message, { expose : true })
    }
    return { isValid : false, errorMsg : message }
  }

  // Check for null/undefined/empty
  if (!packageSpec || typeof packageSpec !== 'string') {
    return handleError('Package spec must be a non-empty string')
  }

  const trimmedSpec = packageSpec.trim()
  if (trimmedSpec.length === 0) {
    return handleError('Package spec cannot be empty or whitespace')
  }

  // Handle file: protocol packages
  if (trimmedSpec.startsWith('file:')) {
    if (!allowFilePackages) {
      return handleError('File protocol packages are not allowed. Set allowFilePackages option to true.')
    }

    const filePath = trimmedSpec.substring(5) // Remove 'file:' prefix
    return validateFilePackageSpec(filePath, trimmedSpec, throwIfInvalid)
  }

  // For non-file packages, validate as standard npm package spec
  return validateNpmPackageSpec(trimmedSpec, throwIfInvalid)
}

/**
 * Validates a file: protocol package specification
 * @private
 */
const validateFilePackageSpec = (filePath, originalSpec, throwIfInvalid) => {
  const handleError = (message) => {
    if (throwIfInvalid) {
      throw createError(400, message, { expose : true })
    }
    return { isValid : false, errorMsg : message }
  }

  if (!filePath || filePath.trim().length === 0) {
    return handleError('File path cannot be empty in file: protocol spec')
  }

  // File paths can contain '..' which is valid for relative paths
  // But we need to validate the path points to a valid package location

  // Resolve to absolute path for validation
  const resolvedPath = fsPath.resolve(filePath)

  // Check if path exists
  if (!existsSync(resolvedPath)) {
    return handleError(`File package path does not exist: ${filePath}`)
  }

  const stats = statSync(resolvedPath)

  // Must be either a .tgz file or a directory
  if (stats.isFile()) {
    if (!resolvedPath.endsWith('.tgz') && !resolvedPath.endsWith('.tar.gz')) {
      return handleError('File package must be a .tgz or .tar.gz archive')
    }
  }
  else if (!stats.isDirectory()) {
    return handleError('File package must be a directory or .tgz file')
  }

  // Additional check: if it's a directory, it should contain package.json
  if (stats.isDirectory()) {
    const packageJsonPath = fsPath.join(resolvedPath, 'package.json')
    if (!existsSync(packageJsonPath)) {
      return handleError('File package directory must contain package.json')
    }
  }

  return {
    isValid       : true,
    isFilePackage : true,
    cleanSpec     : originalSpec,
    resolvedPath
  }
}

/**
 * Validates a standard npm package specification
 * @private
 */
const validateNpmPackageSpec = (packageSpec, throwIfInvalid) => {
  const handleError = (message) => {
    if (throwIfInvalid) {
      throw createError(400, message, { expose : true })
    }
    return { isValid : false, errorMsg : message }
  }

  // Extract package name (remove version/tag if present)
  // Handle formats like: package, package@1.0.0, @scope/package, @scope/package@1.0.0
  let packageName = packageSpec
  let versionPart = ''

  // For scoped packages (@scope/name@version), we need special handling
  if (packageSpec.startsWith('@')) {
    const parts = packageSpec.split('@')
    // parts will be ['', 'scope/name', 'version'] or ['', 'scope/name']
    if (parts.length === 2) {
      packageName = '@' + parts[1] // @scope/name
    }
    else if (parts.length === 3) {
      packageName = '@' + parts[1] // @scope/name
      versionPart = parts[2] // version
    }
    else {
      return handleError(`Invalid scoped package format: ${packageSpec}`)
    }
  }
  else {
    // Unscoped package
    const atIndex = packageSpec.indexOf('@')
    if (atIndex > 0) {
      packageName = packageSpec.substring(0, atIndex)
      versionPart = packageSpec.substring(atIndex + 1)
    }
  }

  // Additional security checks FIRST to prevent path traversal and shell injection
  // These checks must happen before format validation to ensure security checks take precedence
  if (packageName.includes('..') || packageName.includes('\\')) {
    return handleError(`Package name contains invalid path characters: ${packageName}`)
  }

  // Check for shell metacharacters that could enable command injection (excluding ~ which is valid in semver)
  const dangerousChars = /[;&|`$(){}[\]<>!\n\r]/
  if (dangerousChars.test(packageName)) {
    return handleError(`Package name contains shell metacharacters: ${packageName}`)
  }

  if (versionPart && dangerousChars.test(versionPart)) {
    return handleError(`Package version contains shell metacharacters: ${versionPart}`)
  }

  // Prevent reserved/dangerous names
  const reservedNames = ['node_modules', 'favicon.ico', 'package.json', '.', '..']
  if (reservedNames.includes(packageName.toLowerCase())) {
    return handleError(`Package name is reserved: ${packageName}`)
  }

  // Validate package name follows npm naming rules
  // NPM package names must:
  // - Be lowercase (except scoped packages which use @ and /)
  // - Contain only URL-safe characters
  // - Not start with . or _
  // - Be <= 214 characters
  const scopeMatch = packageName.match(/^(@([a-z0-9-~][a-z0-9-._~]*)\/)?([a-z0-9-~][a-z0-9-._~]*)$/)
  if (!scopeMatch) {
    return handleError(`Invalid npm package name format: ${packageName}`)
  }

  // Check length limits (npm limit is 214 chars)
  if (packageName.length > 214) {
    return handleError(`Package name too long (max 214 characters): ${packageName}`)
  }

  return {
    isValid       : true,
    isFilePackage : false,
    cleanSpec     : packageSpec,
    packageName,
    versionPart
  }
}

export { validatePackageSpec }
