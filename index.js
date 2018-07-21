try {
    require('electron-reload')(__dirname, {
      ignored: [
        `${__dirname}/node_modules`,
        `${__dirname}/index.js`,
        `${__dirname}/package.json`
      ]
    });
  } catch(e) {};
  

const { BrowserWindow, app, Menu, MenuItem } = require("electron");

let win = null;

function initMainWindow() {
    win = new BrowserWindow({
        width: 700,
        height: 500,
        frame: false,
        icon: __dirname + "/app/icon.png",
        webPreferences: {
            webSecurity: false,
            experimentalFeatures: true
        }
    });
    win.setMenuBarVisibility(false);
    win.on('closed', () => {
        win = null
    });
    win.loadFile("app/index.html");
}


function initApplication() {
    app.on('ready', () => { 
        initMainWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
    app.on('activate', () => {
        if (win === null) {
            initMainWindow();
        }
    });
}

initApplication();