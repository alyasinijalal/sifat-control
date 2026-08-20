import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle('get-system-hwid', () => {
  try {
    const cpus = os.cpus().map(c => c.model).join('|');
    const hostname = os.hostname();
    const arch = os.arch();
    const totalmem = os.totalmem();
    const rawInfo = `${cpus}-${hostname}-${arch}-${totalmem}`;
    const hash = crypto.createHash('sha256').update(rawInfo).digest('hex').toUpperCase();
    return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
  } catch (err) {
    return 'HWID-DEFAULT-0000';
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Sifat Control - Фармацевтический аудит',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'electron', 'preload.cjs'),
      devTools: !app.isPackaged ? true : false
    }
  });

  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  win.loadFile(indexPath).catch(() => {
    win.loadURL('http://localhost:3000');
  });
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
