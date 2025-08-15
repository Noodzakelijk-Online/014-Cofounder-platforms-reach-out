/**
 * A simple placeholder engine to replace variables like {{key}}
 * with values from a metadata object.
 */

const placeholderRegex = /\{\{([^}]+)\}\}/g;

function replace(text, metadata) {
  if (!text || !metadata) {
    return text;
  }

  return text.replace(placeholderRegex, (match, key) => {
    // Trim the key to remove any leading/trailing whitespace
    const trimmedKey = key.trim();
    // Return the value from metadata, or the original match if not found
    return metadata.hasOwnProperty(trimmedKey) ? metadata[trimmedKey] : match;
  });
}

module.exports = { replace };
