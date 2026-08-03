const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let lastCopiedText = "";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#0a0a0b',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // macOS Menu Bar Icon
  tray = new Tray(path.join(__dirname, '../public/trayTemplate.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'PasteTimeline macOS', enabled: false },
    { type: 'separator' },
    {
      label: 'Open PasteTimeline Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'Quick Paste Overlay (Cmd+Shift+V)',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('trigger-quick-paste');
          mainWindow.show();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('PasteTimeline macOS Clipboard Manager');
  tray.setContextMenu(contextMenu);
}

// macOS System Clipboard Polling Service
function startClipboardMonitor() {
  setInterval(() => {
    try {
      const text = clipboard.readText();
      if (text && text !== lastCopiedText && text.trim().length > 0) {
        lastCopiedText = text;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('native-clipboard-item', {
            content: text,
            app: 'macOS Native Clipboard',
            type: 'text',
          });
        }
      }
    } catch (e) {
      // Ignore reading errors
    }
  }, 1000);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startClipboardMonitor();

  // Register Global Hotkey Cmd+Shift+V for macOS
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
      mainWindow.webContents.send('trigger-quick-paste');
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
