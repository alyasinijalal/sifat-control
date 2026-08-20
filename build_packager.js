import { packager } from '@electron/packager';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const tempOut = path.join(os.tmpdir(), 'sifat_build_out');
  if (fs.existsSync(tempOut)) {
    fs.rmSync(tempOut, { recursive: true, force: true });
  }

  console.log('Building app package in temp folder...');
  const appPaths = await packager({
    dir: __dirname,
    name: 'Sifat Control',
    platform: 'win32',
    arch: 'x64',
    out: tempOut,
    overwrite: true,
    prune: false,
    ignore: [/node_modules/, /dist-app/, /dist-release/, /--win32-x64/, /build_packager\.js/],
  });
  console.log('Package built at:', appPaths);

  const builtAppFolder = path.join(tempOut, 'Sifat Control-win32-x64');

  // Copy to dist-app
  const distApp = path.join(__dirname, 'dist-app', 'Sifat Control-win32-x64');
  fs.mkdirSync(path.dirname(distApp), { recursive: true });
  if (fs.existsSync(distApp)) fs.rmSync(distApp, { recursive: true, force: true });
  fs.cpSync(builtAppFolder, distApp, { recursive: true });
  console.log('Copied to dist-app!');

  // Copy to dist-release
  const distRelease = path.join(__dirname, 'dist-release', 'Sifat Control-win32-x64');
  fs.mkdirSync(path.dirname(distRelease), { recursive: true });
  if (fs.existsSync(distRelease)) fs.rmSync(distRelease, { recursive: true, force: true });
  fs.cpSync(builtAppFolder, distRelease, { recursive: true });
  console.log('Copied to dist-release!');
}

build().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
