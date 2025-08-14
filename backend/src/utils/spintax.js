/**
 * A simple spintax engine to process text like {Hello|Hi|Hey}.
 * It supports nested spintax.
 */

const spintaxRegex = /\{([^{}]+)\}/;

function spin(text) {
  let match = spintaxRegex.exec(text);

  while (match) {
    const options = match[1].split('|');
    const randomIndex = Math.floor(Math.random() * options.length);
    const choice = options[randomIndex];
    text = text.replace(match[0], choice);
    match = spintaxRegex.exec(text);
  }

  return text;
}

module.exports = { spin };
