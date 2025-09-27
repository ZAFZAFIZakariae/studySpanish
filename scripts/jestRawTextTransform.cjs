const { readFileSync } = require('node:fs');

module.exports = {
  process(sourceText, sourcePath) {
    const content = sourceText ?? readFileSync(sourcePath, 'utf8');
    return {
      code: `module.exports = ${JSON.stringify(content)};`,
    };
  },
};
