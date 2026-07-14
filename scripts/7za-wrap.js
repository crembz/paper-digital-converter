const { execFile } = require('child_process');
const path = require('path');
const real7za = path.join(__dirname, '..', 'node_modules', '7zip-bin', 'win', 'x64', '7za_real.exe');
execFile(real7za, process.argv.slice(2), { windowsVerbatimArguments: true }, (err, stdout, stderr) => {
  const code = err ? (err.code === 2 ? 0 : (err.code || 1)) : 0;
  process.stdout.write(stdout || '');
  process.stderr.write(stderr || '');
  process.exit(code);
});
