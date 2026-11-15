const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, shell, Menu } = require('electron');

// Enable WebXR + OpenXR on Windows PCVR headsets (Quest Link / Air Link / SteamVR)
app.commandLine.appendSwitch('enable-features', 'WebXR,OpenXR');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveDistDir() {
  const packagedDist = path.join(__dirname, 'dist');
  if (fs.existsSync(path.join(packagedDist, 'index.html'))) {
    return packagedDist;
  }
  const repoDist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(path.join(repoDist, 'index.html'))) {
    return repoDist;
  }
  throw new Error('Dossier dist/ introuvable. Lancez npm run build d\'abord.');
}

function startStaticServer(distDir) {
  const server = http.createServer((req, res) => {
    const rawUrl = (req.url || '/').split('?')[0].split('#')[0];
    let relPath = decodeURIComponent(rawUrl);
    if (relPath === '/' || relPath === '') {
      relPath = '/index.html';
    }

    const safeTarget = path.resolve(distDir, '.' + relPath);
    if (!safeTarget.startsWith(distDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let fileToServe = safeTarget;
    if (!fs.existsSync(fileToServe) || fs.statSync(fileToServe).isDirectory()) {
      fileToServe = path.join(distDir, 'index.html');
    }

    const ext = path.extname(fileToServe).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(fileToServe).pipe(res);
  });

  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err && err.code === 'EADDRINUSE') {
        server.removeListener('error', onError);
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          resolve({ server, port: addr.port });
        });
      } else {
        reject(err);
      }
    };
    server.once('error', onError);
    // Fixed port keeps localStorage profiles persistent across launches
    server.listen(41789, '127.0.0.1', () => {
      server.removeListener('error', onError);
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

let activeServer = null;
let mainWindow = null;

async function createMainWindow() {
  const distDir = resolveDistDir();
  const { server, port } = await startStaticServer(distDir);
  activeServer = server;
  const localOrigin = `http://127.0.0.1:${port}`;

  Menu.setApplicationMenu(null);

  const iconPath = path.join(distDir, 'pwa-512x512.png');
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Uranie VR — Observatoire Astrologique',
    backgroundColor: '#05070e',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  // Allow F11 fullscreen toggle on PC
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  // Open external HTTP(S) & mailto links in Windows default browser/mail client
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(localOrigin)) {
      return { action: 'allow' };
    }
    if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(localOrigin)) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) {
        void shell.openExternal(url);
      }
    }
  });

  await win.loadURL(`${localOrigin}/`);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await createMainWindow();
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (activeServer) {
      activeServer.close();
      activeServer = null;
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
