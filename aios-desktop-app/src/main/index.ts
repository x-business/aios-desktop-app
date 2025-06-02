<<<<<<< HEAD
import { app, BrowserWindow, protocol, net } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { setupLogging } from "./logging.js";
import { createMainWindow } from "./windowManager.js";
import { mapToolToDefinition } from "./utils.js";
import { registerIpcHandlers } from "./ipc-handlers.js";
import { MainConnectionManager } from "./connection-manager.js";
import { ExtensionManager } from "./extension-manager.js";
import config from "./config.js";
import * as path from "path";
import * as fs from "fs";
import { pathToFileURL } from "url";
import { AuthService, setupAuthHandlers } from "./auth-service.js";
import { registerProtocolHandlerWindows } from "./protocol.js";
=======
import { app, BrowserWindow, protocol, net } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupLogging } from './logging.js'
import { createMainWindow } from './windowManager.js'
import { mapToolToDefinition } from './utils.js'
import { registerIpcHandlers } from './ipc-handlers.js'
import { MainConnectionManager } from './connection-manager.js'
import { ExtensionManager } from './extension-manager.js'
import config from './config.js'
import * as path from 'path'
import * as fs from 'fs'
import { pathToFileURL } from 'url'
import { RemoteIntegrationManager } from './remote-integration-manager.js'
import { ToolService } from './tool-service.js'
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417

// Register ext-asset scheme as privileged before app is ready
// This allows it to work with fetch API, service workers etc. inside the webview
protocol.registerSchemesAsPrivileged([
  {
    scheme: "ext-asset",
    privileges: {
      standard: true, // Treat it like http/https
      secure: true, // Treat it as secure
      supportFetchAPI: true, // Allow fetch() from this origin
      bypassCSP: false, // Content Security Policy should still apply
    },
  },
  {
    scheme: "aios",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      corsEnabled: true,
    }
  },
]);

setupLogging();

let mainConnectionManager: MainConnectionManager | null = null;
let extensionManager: ExtensionManager | null = null;
<<<<<<< HEAD
let authService: AuthService | null = null;
let currentMainWindow: BrowserWindow | null = null;
=======
const remoteIntegrationManager = new RemoteIntegrationManager();
let toolService: ToolService | null = null;
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417

let gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle deep linking for Windows
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("aios", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("aios");
  }

  // Handle the protocol for second instances
  app.on("second-instance", (_event, commandLine) => {
    if (currentMainWindow) {
      if (currentMainWindow.isMinimized()) currentMainWindow.restore();
      currentMainWindow.focus();
    }

    // Protocol handler for windows
    const url = commandLine.find((arg) => arg.startsWith("aios://"));
    if (url) {
      console.log("[Main] Received URL from second instance:", url);
      handleAuthCallback(url);
    }
  });

  // Handle the protocol for macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    console.log("[Main] Received URL:", url);
    handleAuthCallback(url);
  });

  // Handle the protocol for Windows in development
  if (process.defaultApp) {
    app.on("ready", () => {
      const protocolUrl = process.argv.find((arg) => arg.startsWith("aios://"));
      if (protocolUrl) {
        console.log("[Main] Handling protocol URL from argv:", protocolUrl);
        handleAuthCallback(protocolUrl);
      }
    });
  }

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId("com.aios.client");

<<<<<<< HEAD
    // Add this near the start of the function
    registerProtocolHandlerWindows();

    // --- Add log before registration ---
    console.log(
      "[Main] Attempting to register protocol handler for ext-asset..."
    );

    // Register custom protocol handler using the modern API
    protocol.handle("ext-asset", (request) => {
      console.log(`[Protocol] Handling ext-asset request: ${request.url}`);
      if (!extensionManager) {
        console.error(
          "[Protocol] Error: ExtensionManager not initialized yet."
        );
        // Return a Response object for errors
        return new Response("Service Unavailable: ExtensionManager not ready", {
          status: 503,
        });
      }

      try {
        const url = new URL(request.url);
        const extensionId = url.hostname;
        // Ensure leading slash is removed for path joining, handle potential encoded characters
        let requestedPath = decodeURIComponent(
          url.pathname.startsWith("/")
            ? url.pathname.substring(1)
            : url.pathname
        );

        console.log(
          `[Protocol] Parsed - ID: ${extensionId}, Requested Path: ${requestedPath}`
        );

        // Basic path validation
        if (!extensionId || requestedPath.includes("..")) {
          console.error(
            `[Protocol] Error: Invalid request - Extension ID missing or path traversal attempt.`
          );
          return new Response("Bad Request: Invalid path", { status: 400 });
        }

        const extensionInfo = extensionManager
          .getManagedExtensionsInfo()
          .get(extensionId);
        if (!extensionInfo) {
          console.error(
            `[Protocol] Error: Extension info not found for ID: ${extensionId}`
          );
          return new Response(`Not Found: Extension '${extensionId}'`, {
            status: 404,
          });
        }

        if (!extensionInfo.manifest.frontend) {
          console.error(
            `[Protocol] Error: Extension ${extensionId} has no frontend configured in manifest.`
          );
          return new Response(
            `Not Found: Frontend not configured for '${extensionId}'`,
            { status: 404 }
          );
        }

        // Construct path relative to the extension's *directory containing* the frontend HTML file
        let absolutePath;

        // Special case for the root path - directly use the frontend file path
        if (!requestedPath || requestedPath === "/") {
          absolutePath = path.join(
            extensionInfo.path,
            extensionInfo.manifest.frontend
          );
        } else {
          // For all other paths, resolve relative to the frontend directory
          const frontendFilePath = path.join(
            extensionInfo.path,
            extensionInfo.manifest.frontend
          );
          const frontendDir = path.dirname(frontendFilePath);
          absolutePath = path.join(frontendDir, requestedPath);
        }

        console.log(`[Protocol] Resolved absolute path: ${absolutePath}`);

        // Check if file exists *before* calling net.fetch to provide clearer errors
        // Note: fs.promises.access is generally preferred over fs.stat for existence checks
        return fs.promises
          .access(absolutePath, fs.constants.R_OK)
          .then(() => {
            // Convert file path to file:// URL for net.fetch
            const fileUrl = pathToFileURL(absolutePath).toString();
            console.log(`[Protocol] Fetching file URL: ${fileUrl}`);
            return net.fetch(fileUrl);
          })
          .catch((err) => {
            console.error(
              `[Protocol] Error: File not accessible at path: ${absolutePath}`,
              err
            );
            // Return a 404 Response if file doesn't exist or isn't readable
            return new Response(
              `Not Found: Resource at '${requestedPath || extensionInfo.manifest.frontend}'`,
              { status: 404 }
            );
          });
      } catch (error) {
        console.error(
          `[Protocol] Unexpected error processing request ${request.url}:`,
          error
        );
        // Return a generic server error response
        return new Response("Internal Server Error", { status: 500 });
      }
    });

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    currentMainWindow = await createMainWindow();

    console.log("[Main] Instantiating ExtensionManager...");
    extensionManager = new ExtensionManager();
    console.log("[Main] ExtensionManager instantiated.");

    try {
=======
  // Now that extensionManager and remoteIntegrationManager are available, instantiate ToolService
  if (extensionManager && remoteIntegrationManager) {
    toolService = new ToolService(extensionManager, remoteIntegrationManager);
    console.log("[Main] ToolService instantiated.");
  } else {
    console.error("[Main] Critical error: ExtensionManager or RemoteIntegrationManager not available for ToolService initialization.");
    // Handle this critical error appropriately, perhaps by exiting or showing an error dialog
    app.quit();
    return; // Prevent further execution in this block if ToolService can't be initialized
  }

  try {
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
      console.log("[Main] Discovering and loading extensions...");
      await extensionManager.discoverAndLoadExtensions();
      console.log("[Main] Initial extension discovery and load complete.");

      // --- Fetch online registry ---
      try {
        console.log("[Main] Fetching online extension registry...");
        await extensionManager.fetchOnlineRegistry(
          config.mcpExtensionRegistryUrl
        );
        console.log("[Main] Online extension registry fetched.");
      } catch (error) {
        console.error(
          "[Main] Error fetching online extension registry:",
          error
        );
      }
      // --------------------------
    } catch (error) {
      console.error(
        "[Main] Error during initial extension discovery/load:",
        error
      );
    }

    if (currentMainWindow && extensionManager) {
      console.log(
        `[Main] Using WebSocket URL from config: ${config.webSocketUrl}`
      );
      console.log("[Main] Instantiating MainConnectionManager...");
      mainConnectionManager = new MainConnectionManager({
<<<<<<< HEAD
        webSocketUrl: config.webSocketUrl,
        mainWindow: currentMainWindow,
        extensionManager: extensionManager,
        debug: is.dev,
=======
          webSocketUrl: config.webSocketUrl,
          mainWindow: currentMainWindow,
          toolService: toolService,
          debug: is.dev
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
      });
      console.log("[Main] MainConnectionManager instantiated.");

      if (mainConnectionManager && extensionManager && remoteIntegrationManager && toolService) {
        registerIpcHandlers({
          mainConnectionManager: mainConnectionManager,
          extensionManager: extensionManager,
<<<<<<< HEAD
=======
          remoteIntegrationManager: remoteIntegrationManager,
          toolService: toolService
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
        });
      } else {
        console.error(
          "[Main] Failed to register IPC handlers: Managers not fully initialized."
        );
      }

      console.log(
        "[Main] Initializing MainConnectionManager (WebSocket connection attempt)..."
      );
      await mainConnectionManager.initialize();
      console.log("[Main] MainConnectionManager initialization called.");

      console.log("[Main] Starting auto-connection of enabled extensions...");
      await extensionManager.connectAllEnabledExtensions();
      console.log("[Main] Finished auto-connection attempts for extensions.");

      try {
<<<<<<< HEAD
        console.log("[Main] Getting initial tool list after auto-connect...");
        const initialTools = extensionManager.getAllActiveTools();
        const toolDefinitions = initialTools.map(mapToolToDefinition);
        console.log(
          `[Main] Sending initial 'tools-updated' event with ${toolDefinitions.length} tools.`
        );
        currentMainWindow.webContents.send("tools-updated", toolDefinitions);
=======
          console.log("[Main] Getting initial tool list after auto-connect...");
          const initialTools = toolService.getAllActiveTools();
          const toolDefinitions = initialTools.map(mapToolToDefinition);
          console.log(`[Main] Sending initial 'tools-updated' event with ${toolDefinitions.length} tools.`);
          currentMainWindow.webContents.send('tools-updated', toolDefinitions);
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
      } catch (error: any) {
        console.error(
          "[Main] Error getting or sending initial tool list:",
          error
        );
      }
    } else {
      console.error(
        "[Main] Failed to create main window or ExtensionManager, cannot initialize Connection Manager or register IPC handlers."
      );
    }

    // Initialize auth service
    console.log("[Main] Initializing AuthService...");
    authService = new AuthService();
    setupAuthHandlers(authService);

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });
}

let isShuttingDown = false;

app.on("will-quit", async (event) => {
  if (isShuttingDown) {
    console.log(
      "[Main] Shutdown already in progress, ignoring subsequent will-quit event."
    );
    return;
  }
  isShuttingDown = true;
  console.log("[Main] App quitting, performing shutdown...");

  // Prevent immediate quit to allow async shutdown
  event.preventDefault();

  let wsShutdownComplete = false;
  let mcpShutdownComplete = false;
  let remoteShutdownComplete = false;

<<<<<<< HEAD
  const checkAndQuit = () => {
    if (wsShutdownComplete && mcpShutdownComplete) {
      console.log("[Main] All managers shut down. Calling app.quit() now.");
      app.quit();
      console.log("[Main] Calling app.exit(0) immediately after app.quit().");
      app.exit(0);
    }
  };

  if (mainConnectionManager) {
    console.log("[Main] Shutting down WebSocket Connection Manager...");
    try {
      await mainConnectionManager.shutdown();
      console.log("[Main] WebSocket Connection Manager shutdown complete.");
    } catch (error) {
      console.error(
        "[Main] Error shutting down WebSocket Connection Manager:",
        error
      );
    } finally {
      wsShutdownComplete = true;
      checkAndQuit();
    }
  } else {
    wsShutdownComplete = true;
    checkAndQuit();
  }

  if (extensionManager) {
    console.log(
      "[Main] Shutting down Extension Manager (disconnecting MCPs)..."
    );
    try {
      await extensionManager.disconnectAll();
      console.log("[Main] Extension Manager shutdown complete.");
    } catch (error) {
      console.error("[Main] Error shutting down Extension Manager:", error);
    } finally {
      mcpShutdownComplete = true;
      checkAndQuit();
    }
  } else {
    mcpShutdownComplete = true;
    checkAndQuit();
=======
  const newCheckAndQuit = () => {
      if (wsShutdownComplete && mcpShutdownComplete && remoteShutdownComplete) {
          console.log('[Main] All managers shut down. Calling app.quit() now.');
          app.quit();
          console.log('[Main] Calling app.exit(0) immediately after app.quit().');
          app.exit(0);
      }
  };

  if (mainConnectionManager) {
      console.log('[Main] Shutting down WebSocket Connection Manager...');
      try {
          await mainConnectionManager.shutdown();
          console.log('[Main] WebSocket Connection Manager shutdown complete.');
      } catch (error) {
          console.error('[Main] Error shutting down WebSocket Connection Manager:', error);
      } finally {
          wsShutdownComplete = true;
      }
  } else {
      wsShutdownComplete = true;
  }

  if (extensionManager) {
      console.log('[Main] Shutting down Extension Manager (disconnecting MCPs)...');
      try {
          await extensionManager.disconnectAll();
          console.log('[Main] Extension Manager shutdown complete.');
      } catch (error) {
          console.error('[Main] Error shutting down Extension Manager:', error);
      } finally {
          mcpShutdownComplete = true;
      }
  } else {
      mcpShutdownComplete = true;
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
  }

  if (remoteIntegrationManager) {
    console.log('[Main] Shutting down Remote Integration Manager (disconnecting remote MCPs)...');
    try {
        await remoteIntegrationManager.disconnectAllIntegrations();
        console.log('[Main] Remote Integration Manager shutdown complete.');
    } catch (error) {
        console.error('[Main] Error shutting down Remote Integration Manager:', error);
    }
  }

  remoteShutdownComplete = true;

  newCheckAndQuit();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Add this helper function
function handleAuthCallback(url: string) {
  if (url.startsWith("aios://auth/callback")) {
    console.log("[Main] Processing auth callback...");
    authService?.handleAuthCallback(url).then((success) => {
      console.log("[Main] Auth callback processed:", success);

      if (success && authService && currentMainWindow) {
        const currentState = authService.getAuthState();
        console.log(
          "[Main] Sending updated auth state to renderer:",
          currentState
        );
        currentMainWindow.webContents.send("auth-state-changed", currentState);
      }
    });
  }
}
