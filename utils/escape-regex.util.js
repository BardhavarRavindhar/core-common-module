/**
 * @module escapeRegExp
 * 
 * This module used for escape Regex Expression special characters.
 * 
 */

const escapeRegExp = (regex) => {
  return regex.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export default escapeRegExp;