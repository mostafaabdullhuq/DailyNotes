//* load required modules
const { ipcMain } = require("electron/main");
const electron = require("electron"),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    path = require("path"),
    Menu = electron.Menu,
    Tray = electron.Tray,
    globalShortcut = electron.globalShortcut;
windowStateKeeper = require("electron-window-state");

//* initalize main window
let mainWindow,
    //* initalize context menu components
    contextMenuArray = [
        {
            label: "Cut",
            role: "cut",
        },
        {
            label: "Copy",
            role: "copy",
        },
        {
            label: "Select All",
            role: "selectall",
        },
        {
            label: "Paste",
            role: "paste",
        },
    ],
    //* initalize tray menu compontents
    trayContextMenu = [
        {
            label: "Show / Hide",
            //* when clicked, if the window is visible hide it and if it's hidden show it
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                }
            },
            accelerator: "CommandOrControl+Alt+o",
        },
        {
            //* when clicked show the main window and click on the add note button to trigger the add note window
            label: "Add Note",
            click: () => {
                mainWindow.show();
                mainWindow.webContents.executeJavaScript(`document.querySelector("nav .add-button").click()`);
            },
            accelerator: "CommandOrControl+Alt+n",
        },
        {
            label: "Quit",
            role: "quit",
            accelerator: "CommandOrControl+Alt+x",
        },
    ],
    trayMenu,
    appTray;

//* when app is ready to launch
app.on("ready", (e) => {
    //* register the add note shortcut to the app
    globalShortcut.register("CommandOrControl+Alt+n", () => {
        mainWindow.show();
        mainWindow.webContents.executeJavaScript(`document.querySelector("nav .add-button").click()`);
    });
    //* register the show / hide shortcut to the app
    globalShortcut.register("CommandOrControl+Alt+o", () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
    //* register the exit shortcut to the app

    globalShortcut.register("CommandOrControl+Alt+x", () => {
        app.quit();
        mainWindow = null;
    });

    //* define the window state keeper to remember the menu coordinates and size after close
    let windowState = windowStateKeeper({
        defaultWidth: 700,
        defaultHeight: 700,
    });
    //* define the main window
    mainWindow = new BrowserWindow({
        minWidth: 700,
        minHeight: 750,
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    //* apply the window state keeper to the main window
    windowState.manage(mainWindow);
    //* hide the menu bar of the main window
    Menu.setApplicationMenu(null);
    //* load the renderer design
    mainWindow.loadFile(path.join(__dirname, "Renderer/renderer.html"));
    //* initalize the context menu
    let contextMenu = Menu.buildFromTemplate(contextMenuArray);
    //* when user right click show the custom context menu
    mainWindow.webContents.on("context-menu", () => {
        contextMenu.popup();
    });
    mainWindow.webContents.toggleDevTools();
    //* initalize the tray menu
    trayMenu = Menu.buildFromTemplate(trayContextMenu);
    //* set the tray icon
    appTray = new Tray(path.join(__dirname, "icon.ico"));
    //* set a title to be shown when hover to the tray
    appTray.setToolTip("DailyNotes");
    appTray.setContextMenu(trayMenu);
    appTray.on("double-click", () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
});

//* when main window closed , clsoe the app
app.on("closed", (e) => {
    app.quit();
    mainWindow = null;
    appTray = null;
});
