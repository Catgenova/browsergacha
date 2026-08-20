// Runs every test file. `node test/run.js` locally; CI runs the same.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname)
  .filter((f) => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  process.stdout.write(`\n── ${f} ${'─'.repeat(Math.max(0, 40 - f.length))}\n`);
  try {
    execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
  } catch (e) {
    failed++;
  }
}
if (failed) {
  console.error(`\n${failed} test file(s) failed`);
  process.exit(1);
}
console.log('\nAll test files passed.');
