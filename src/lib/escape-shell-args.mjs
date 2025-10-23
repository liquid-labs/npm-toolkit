/**
 * Escapes a string for safe use in shell commands by wrapping it in single quotes
 * and escaping any single quotes within the string.
 *
 * @private
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for shell execution
 */
const escapeShellArg = (str) => {
  if (typeof str !== 'string') {
    throw new Error('escapeShellArg requires a string argument')
  }
  // Replace each single quote with '\'' (end quote, escaped quote, start quote)
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

export { escapeShellArg }
