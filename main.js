const path = require("path");
const os = require("os");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const slash = require("slash");
const log = require("electron-log");

//Set environment
// process.env.NODE_ENV = "development";
process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "ImageSmash",
    width: isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/icons/Icon_256x256.png`,
    resizable: isDev ? true : false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Loading files / URls. Either / or for files.
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  //mainWindow.loadFile(".app/index.html");
}

// About Window (for MacOS)
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "About ImageSmash",
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: "white",
  });

  // Loading files / URls. Either / or for files.
  aboutWindow.loadURL(`file://${__dirname}/app/about.html`);
  //mainWindow.loadFile(".app/index.html");
}

app.on("ready", () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Clean up memory on close
  mainWindow.on("closed", () => (mainWindow = null));
});

// Setting up custom menu bar
const menu = [
  //For MacOS menu bars only, creating 'About' page
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    // label: "File",
    // submenu: [
    //   {
    //     label: "Quit",
    //     // Keyboard shortcuts. Can use either one.
    //     //accelerator: isMac ? "Command+W" : "Ctrl+W",
    //     accelerator: "CmdOrCtrl+W",
    //     click: () => app.quit(),
    //   },
    // ],
    // Replaces ^^ with use of Electron Menu Roles
    role: "fileMenu",
  },
  // Creating developer options when in 'Developer' mode
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
  // Creating 'About' window for Windows and Linux
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

// Receives command from event listener from render.js
// Sets destination path and calls shrinkImage function
ipcMain.on("image:smallify", (e, options) => {
  options.dest = path.join(os.homedir(), "imagesmash");
  shrinkImage(options);
});

// Calls imagemin for either JPEG or PNG files
// JPEG quality range: 0 - 100
// PNG quality range: 0 - 1
async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });

    log.info(files);

    shell.openPath(dest);

    mainWindow.webContents.send("image:done");
  } catch (err) {
    log.error(err);
  }
}

// vvv FROM ELECTRON DOCUMENTATION vvv
// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
