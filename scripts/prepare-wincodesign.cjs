const { execFile } = require('child_process');
const { renameSync, unlinkSync, existsSync, writeFileSync } = require('fs');
const { join } = require('path');

const sevenZipDir = join(__dirname, '..', 'node_modules', '7zip-bin', 'win', 'x64');
const sevenZipExe = join(sevenZipDir, '7za.exe');
const sevenZipBat = join(sevenZipDir, '7za_wrapper.bat');
const sevenZipReal = join(sevenZipDir, '7za_real.exe');

async function main() {
  // Replace 7za.exe with a wrapper that treats exit code 2 as success
  // (exit code 2 means symlinks failed but files were extracted)
  if (existsSync(sevenZipReal)) {
    console.log('7za already patched');
    process.exit(0);
  }

  if (!existsSync(sevenZipExe)) {
    console.error('7za.exe not found');
    process.exit(1);
  }

  // Rename original
  renameSync(sevenZipExe, sevenZipReal);

  // Create a wrapper bat that calls the real exe and fixes exit code
  const batContent = [
    '@echo off',
    '"' + sevenZipReal + '" %*',
    'set EXITCODE=%errorlevel%',
    'if %EXITCODE% equ 2 exit 0',
    'exit %EXITCODE%',
  ].join('\r\n');

  writeFileSync(sevenZipBat, batContent);
  console.log('Patched 7za.exe to handle symlink extraction errors');

  // The bat file won't work because execFile prefers .exe extensions.
  // We need a different approach: use a Node.js wrapper as the "exe".
  // Since we can't easily replace .exe, let's try env var approach.
  process.env.ELECTRON_BUILDER_OFFLINE = 'false';

  // Actually, electron-builder uses execFile which won't pick up .bat
  // Let's restore and use a different strategy
  renameSync(sevenZipReal, sevenZipExe);
  if (existsSync(sevenZipBat)) {
    unlinkSync(sevenZipBat);
  }

  // Strategy: Set SE_CREATE_SYMBOLIC_LINK_NAME privilege via env
  // Windows 10+ grants this to all users when Developer Mode is on
  // Fallback: we'll just note that the build may need Developer Mode
  console.log('Note: If build fails, enable Windows Developer Mode to allow symlink creation');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
