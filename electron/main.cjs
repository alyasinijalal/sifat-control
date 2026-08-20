const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

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
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sifat Control — Управление сроками годности и ротацией',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: !app.isPackaged ? true : false,
    },
  });

  // Remove default menu for clean enterprise look
  Menu.setApplicationMenu(null);

  // Load index.html using app.getAppPath() for ASAR compatibility
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('Failed to load local index.html:', err);
    mainWindow.loadURL('http://localhost:3000');
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
