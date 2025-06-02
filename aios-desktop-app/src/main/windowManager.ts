import { shell, BrowserWindow } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

// Track the main window instance
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 * @returns The created BrowserWindow instance
 */
export function createMainWindow(): BrowserWindow {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      // Use join with derived __dirname
      preload: join(__dirname, "../preload/index.mjs"),
      // Keep sandbox: false if needed, otherwise consider true
      sandbox: false,
      // Set recommended security settings
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Add protocol handler for auth callback
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("aios://")) {
      event.preventDefault();
      // handleAuthCallback(url);
    } else if (url.startsWith("http:") || url.startsWith("https:")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Add handler to nullify window object on close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Load the content
  loadInitialContent();

  return mainWindow;
}

/**
 * Loads the initial content (URL or file) into the main window.
 */
function loadInitialContent(): void {
  if (!mainWindow) return;

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    // Use join with derived __dirname
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

/**
 * Returns the main window instance.
 * @returns The main BrowserWindow instance or null if it doesn't exist.
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
