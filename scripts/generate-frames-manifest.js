const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, '..', 'public', 'frames');
const outputFile = path.join(framesDir, 'manifest.json');

try {
  const files = fs.readdirSync(framesDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  console.log(`Successfully generated manifest with ${files.length} frames at ${outputFile}`);
} catch (error) {
  console.error('Error generating frames manifest:', error);
  process.exit(1);
}
