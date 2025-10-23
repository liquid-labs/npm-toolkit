/**
 * Escapes a string for safe use in shell commands.
 * On Windows (cmd.exe), wraps in double quotes and escapes according to Windows argument parsing rules.
 * On Unix/POSIX shells, wraps in single quotes and escapes internal single quotes.
 *
 * @private
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for shell execution
 */
const escapeShellArg = (str) => {
  if (typeof str !== 'string') {
    throw new Error('escapeShellArg requires a string argument')
  }

  // Windows uses cmd.exe which has different quoting rules
  if (process.platform.startsWith('win')) {
    // On Windows, follow the standard argument parsing rules:
    // 1. Backslashes are literal unless immediately followed by a double quote
    // 2. When backslash(es) precede a quote, double the backslashes and escape the quote
    // 3. Backslashes at the end need to be doubled (they precede the closing quote)
    let escaped = str
      // Double backslashes that come before quotes, then escape the quote
      .replace(/(\\*)"/g, (match, backslashes) => {
        return backslashes + backslashes + '\\"'
      })

    // Double backslashes at the end (they precede the closing quote we'll add)
    escaped = escaped.replace(/(\\+)$/, '$1$1')

    return '"' + escaped + '"'
  }

  // Unix/POSIX: Use single quotes and escape single quotes with '\''
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

export { escapeShellArg }
