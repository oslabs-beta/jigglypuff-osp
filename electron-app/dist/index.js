"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        height: 1000,
        width: 1200,
        icon: __dirname + './././assets/circle_logo_thicker.svg',
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true
        },
    });
    // const expressServer = execFile('node', ['/Users/morry/git/Caribu/server/server.js'], {
    //   cwd: path.join(__dirname, '..', 'server'),
    //   env: {
    //     ...process.env,
    //     NODE_PATH: '/Users/morry/git/Caribu/node_modules'
    //   }
    // })
    //this server's node modules are in /Users/morry/git/Caribu/
    // const expressServer = execFile('node', ['/Users/morry/git/Caribu/server/server.js'], {
    //   cwd: path.join(__dirname, '..', 'server'),
    // })
    // expressServer.on('message', (msg) => {
    //   // Handle messages received from the Express server
    //   mainWindow.webContents.send('express-response', msg)
    // })
    // ipcMain.handle('fetch-request', async (event, args) => {
    //   const { url, method, body } = args;
    //   const response = await fetch(`http://localhost:6969${url}`, {
    //     method,
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(body),
    //   });
    //   return response.json();
    // });
    // // Handle messages received from the renderer process
    // ipcMain.on('express-request', (event, arg) => {
    //   // Send the relevant message to the Express server
    //   expressServer.send(arg)
    // })
    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createWindow);
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// run bash script to start node express server in the main process
electron_1.ipcMain.on('runScript', () => {
    const basePath = electron_1.app.getAppPath();
    const serverExists = fs_1.default.existsSync(path_1.default.join(basePath, 'caribuserver'));
    console.log(serverExists);
    // MacOS & Linux bash script
    // run server if it exists, clone server and then run if it doesn't exist
    const scriptPath = serverExists ?
        path_1.default.join(electron_1.app.getAppPath(), 'src', 'serverrun.sh') :
        path_1.default.join(electron_1.app.getAppPath(), 'src', 'serverclone.sh');
    // const scriptPath = 'server.sh'; // BUG: relative path does not work.. tbd if this will work in the packaged app?
    const script = (0, child_process_1.spawn)('bash', [scriptPath]);
    console.log('PID: ' + script.pid);
    script.stdout.on('data', (data) => {
        console.log('stdout: ' + data);
    });
    script.stderr.on('data', (err) => {
        console.log('stderr: ' + err);
    });
    script.on('exit', (code) => {
        console.log('Exit Code: ' + code);
    });
});
//# sourceMappingURL=index.js.map