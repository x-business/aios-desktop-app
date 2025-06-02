import { ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { pathToFileURL } from "url";
import {
  ExtensionManager,
  MCPExtensionConfigError,
} from "./extension-manager.js";
import { getMainWindow } from "./windowManager.js";
import { mapToolToDefinition } from "./utils.js";
import { MainConnectionManager } from "./connection-manager.js";
import type { ManagedExtensionStatus, SystemInfo } from "@shared/types/index.js";
import * as os from "os"; // Add os module for system information

import { processPDF } from "../lib/pdf.js";
import { processDoc } from "../lib/doc.js";
import { fileToBase64 } from "../lib/fileToBase64.js";
import type { ParsedFilePickerResult } from "@shared/types/parsedfile-tyeps.js";
import type { RemoteIntegrationManager } from './remote-integration-manager.js';
import type { ToolService } from './tool-service.js';
import type { PersistedRemoteIntegrationConfig, PipedreamAppMetadata, RuntimeRemoteIntegrationDetails } from '@shared/types/remote-integration.js';
import type { PipedreamAppDiscoveryResult } from '@shared/types/remote-integration.js';

// Helper function return type
interface EnableResult {
  success: boolean;
  error?: string;
  requiresConfiguration?: boolean;
  missingKeys?: string[];
  statuses?: Record<string, ManagedExtensionStatus>;
}

/**
 * Attempts to enable an extension, handles errors, and notifies the renderer window.
 * @param extensionManager The ExtensionManager instance.
 * @param extensionId The ID of the extension to enable.
 * @returns A promise resolving to an EnableResult object.
 */
async function _tryEnableExtensionAndNotify(
  extensionManager: ExtensionManager,
  toolService: ToolService,
  extensionId: string
): Promise<EnableResult> {
  try {
    await extensionManager.enableExtension(extensionId);
    console.log(`[Helper] Extension '${extensionId}' enabled successfully.`);

    // Get updated statuses AFTER successful enable
    const statuses = extensionManager.getManagedExtensionsStatus();
    const statusObj: Record<string, ManagedExtensionStatus> = {};
    statuses.forEach((value, key) => {
      statusObj[key] = value;
    });

    // Update tools via ToolService
    const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
    getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

    return { success: true, statuses: statusObj };
  } catch (error: any) {
    console.error(`[Helper] Error enabling extension '${extensionId}':`, error);

    // Get current statuses even if enable failed, to return to renderer
    const currentStatuses = extensionManager.getManagedExtensionsStatus();
    const currentStatusObj: Record<string, ManagedExtensionStatus> = {};
    currentStatuses.forEach((value, key) => {
      currentStatusObj[key] = value;
    });

    if (error instanceof MCPExtensionConfigError) {
      console.warn(
        `[Helper] Enabling extension '${extensionId}' failed due to missing configuration.`
      );
      getMainWindow()?.webContents.send("mcp-extension-config-required", {
        extensionId: error.extensionId,
        missingKeys: error.missingKeys,
      });
      return {
        success: false,
        error: error.message,
        requiresConfiguration: true,
        missingKeys: error.missingKeys,
        statuses: currentStatusObj,
      };
    }
    return { success: false, error: error.message, statuses: currentStatusObj };
  }
}

/**
 * Dependencies required by the IPC handlers.
 */
export interface IpcHandlerDependencies {
  mainConnectionManager: MainConnectionManager;
  extensionManager: ExtensionManager;
  remoteIntegrationManager: RemoteIntegrationManager;
  toolService: ToolService;
}

/**
 * Registers all IPC handlers with Electron.
 * This should be called once all required dependencies are available.
 * @param dependencies Object containing all the dependencies needed by handlers
 */
export function registerIpcHandlers(
  dependencies: IpcHandlerDependencies
): void {
  const { mainConnectionManager, extensionManager, remoteIntegrationManager, toolService } = dependencies;

  console.log("[Main] Setting up IPC Handlers...");

  // Register all handlers with the dependencies

  // --- Connection handlers ---
  registerConnectionHandlers(mainConnectionManager);

  // --- File handlers ---
  registerFileHandlers();

  // --- Extension management handlers ---
  registerExtensionManagementHandlers(extensionManager, toolService);

  // --- Extension configuration handlers ---
  registerExtensionConfigHandlers(extensionManager);

  // --- Remote Integration handlers ---
  registerRemoteIntegrationHandlers(remoteIntegrationManager, toolService);
  
  // --- System Information handler ---
  registerSystemInfoHandler();

  // --- Add handler for getting the config preload path ---
  ipcMain.handle("get-config-preload-path", () => {
    // Assuming __dirname in the built main process is /path/to/app/out/main
    const preloadPath = path.join(__dirname, "../preload/config-preload.mjs");
    console.log(`[IPC] Calculated config preload path: ${preloadPath}`);
    try {
      // Convert the absolute path to a file:// URL
      const preloadUrl = pathToFileURL(preloadPath).toString();
      console.log(`[IPC] Returning config preload URL: ${preloadUrl}`);
      return preloadUrl;
    } catch (error) {
      console.error(
        `[IPC] Error converting preload path to URL: ${preloadPath}`,
        error
      );
      throw new Error("Failed to construct preload URL."); // Let invoke caller handle error
    }
  });

  console.log("[Main] IPC Handlers set up.");
}

/**
 * Registers handlers related to WebSocket connection state.
 */
function registerConnectionHandlers(mainConnectionManager: any): void {
  // Get WebSocket Connection State
  ipcMain.handle("get-connection-state", () => {
    if (mainConnectionManager) {
      const currentState = mainConnectionManager.getState();
      console.log(
        "[Main] IPC: Handling 'get-connection-state', returning:",
        currentState
      );
      return currentState;
    } else {
      console.warn(
        "[Main] IPC: 'get-connection-state' called before ConnectionManager initialized."
      );
      return { status: "disconnected", connectionId: null, error: null }; // Return disconnected state
    }
  });
}

function registerFileHandlers(): void {
  ipcMain.handle("open-file-picker", async (_event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "All Supported Files",
          extensions: [
            "pdf",
            "docx",
            "doc",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "txt",
            "md",
            "markdown",
          ],
        },
        { name: "Documents", extensions: ["pdf", "docx", "doc"] },
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif"] },
        { name: "Text", extensions: ["txt", "md", "markdown"] },
      ],
    });

    if (!result.filePaths.length) {
      return { success: false, error: "No files selected" };
    }

    const processedResult: ParsedFilePickerResult = {
      success: true,
      messageContent: [] as any[],
      errors: [] as string[],
    };

    for (const filePath of result.filePaths) {
      const extension = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath);

      try {
        const fileBuffer = await fs.readFile(filePath);

        switch (extension) {
          case ".pdf":
            const pdfFile = new File([fileBuffer], fileName, {
              type: "application/pdf",
            });
            const pdfDocs = await processPDF(pdfFile);
            const pdfContent = pdfDocs
              .map(
                (doc) =>
                  `Page ${doc.metadata.page}/${doc.metadata.totalPages}: ${doc.pageContent}`
              )
              .join("\n\n");

            processedResult.messageContent?.push({
              type: "pdf",
              text: pdfContent,
              fileName,
            });
            break;

          case ".docx":
          case ".doc":
            const docFile = new File([fileBuffer], fileName, {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const doc = await processDoc(docFile);
            const docContent = doc
              .map(
                (doc) =>
                  `Page ${doc.metadata.page}/${doc.metadata.totalPages}: ${doc.pageContent}`
              )
              .join("\n\n");
            processedResult.messageContent?.push({
              type: "document",
              text: docContent,
              fileName,
            });
            break;

          case ".jpg":
          case ".jpeg":
          case ".png":
          case ".gif":
            const base64Image = await fileToBase64(filePath);
            processedResult.messageContent?.push({
              type: "image",
              image_url: {
                url: base64Image,
                detail: "auto",
              },
              fileName,
            });
            break;

          case ".txt":
          case ".md":
          case ".markdown":
          case ".json":
            const textContent = await fs.readFile(filePath, "utf-8");
            processedResult.messageContent?.push({
              type: "text",
              text: textContent,
              fileName,
            });
            break;

          default:
            processedResult.messageContent?.push({
              type: "text",
              text: `[Unsupported file: ${fileName}]`,
            });
        }
      } catch (error: any) {
        console.error(`Error processing file ${fileName}:`, error);
        processedResult.errors?.push(
          `Error processing ${fileName}: ${error.message}`
        );
      }
    }

    return processedResult;
  });

  ipcMain.handle("handle-files", async (_event, filesData: any[]) => {
    const processedResult: ParsedFilePickerResult = {
      success: true,
      messageContent: [],
    };
    console.log("filesdata", filesData);
    try {
      for (const fileData of filesData) {
        const fileName = fileData.name;
        const extension = path.extname(fileName).toLowerCase();
        console.log("extension", extension);
        // Convert base64 data to buffer if it exists
        let fileBuffer;
        if (fileData.data) {
          fileBuffer = Buffer.from(fileData.data, "base64");
        } else {
          console.error("No file data received for:", fileName);
          continue;
        }

        switch (extension) {
          case ".pdf":
            const pdfFile = new File([fileBuffer], fileName, {
              type: "application/pdf",
            });
            const pdfDocs = await processPDF(pdfFile);
            processedResult.messageContent.push({
              type: "pdf",
              text: pdfDocs.map((doc) => doc.pageContent).join("\n"),
              fileName,
            });
            break;

          case ".docx":
          case ".doc":
            const docFile = new File([fileBuffer], fileName, {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const docs = await processDoc(docFile);
            processedResult.messageContent.push({
              type: "document",
              text: docs.map((doc) => doc.pageContent).join("\n"),
              fileName,
            });
            break;

          case ".jpg":
          case ".jpeg":
          case ".png":
          case ".gif":
            const base64Data = `data:${fileData.type};base64,${fileBuffer.toString("base64")}`;
            processedResult.messageContent.push({
              type: "image",
              image_url: {
                url: base64Data,
                detail: "auto",
              },
              fileName,
            });
            break;

          case ".txt":
          case ".md":
          case ".markdown":
            const textContent = fileBuffer.toString("utf-8");
            processedResult.messageContent.push({
              type: "text",
              text: textContent,
              fileName,
            });
            break;

          default:
            processedResult.messageContent.push({
              type: "text",
              text: `[Unsupported file: ${fileName}]`,
            });
        }
      }
    } catch (error: any) {
      console.error("Error processing files:", error);
      return {
        success: false,
        error: error.message || "Failed to process files",
      };
    }

    return processedResult;
  });
}

/**
 * Registers handlers related to extension management (installation, enabling, tools, etc).
 */
function registerExtensionManagementHandlers(
  extensionManager: ExtensionManager,
  toolService: ToolService
): void {
  // Note: Convert Maps/Sets to Arrays/Objects for IPC serialization

  // --- Discovery and Information Handlers ---

  // Combined discover & load function
  ipcMain.handle("discover-load-extensions", async () => {
    if (!extensionManager) return { managed: [], discoverable: [] };
    console.log("[Main] IPC: Handling 'discover-load-extensions'...");
    await extensionManager.discoverAndLoadExtensions();
    const managed = Array.from(
      extensionManager.getManagedExtensionsInfo().values()
    );
    const discoverable = Array.from(
      extensionManager.getDiscoverableExtensionsInfo().values()
    );
    return { managed, discoverable };
  });

  // Get Managed Extensions (Info)
  ipcMain.handle("get-managed-extensions", async () => {
    if (!extensionManager) return [];
    console.log("[Main] IPC: Handling 'get-managed-extensions'...");
    const extensions = extensionManager.getManagedExtensionsInfo();
    return Array.from(extensions.values());
  });

  // Get Discoverable Extensions (Info) - Now returns online, non-managed extensions
  ipcMain.handle("get-discoverable-extensions", async () => {
    if (!extensionManager) return [];
    console.log(
      "[Main] IPC: Handling 'get-discoverable-extensions' (fetching online, non-managed)... "
    );
    // Directly call the updated method which returns ExtensionRegistryEntry[]
    const extensions = extensionManager.getDiscoverableExtensionsInfo();
    return extensions; // Return the array directly
  });

  // Get Managed Statuses (enabled/disabled state)
  ipcMain.handle("get-managed-statuses", async () => {
    if (!extensionManager) return {};
    console.log("[Main] IPC: Handling 'get-managed-statuses'...");
    const statuses = extensionManager.getManagedExtensionsStatus();
    const statusObj: Record<string, any> = {};
    statuses.forEach((value, key) => {
      statusObj[key] = value;
    });
    return statusObj;
  });

  // --- NEW: Handler to fetch online registry ---
  ipcMain.handle("extensions:fetch-registry", async () => {
    if (!extensionManager) {
      console.error(
        "[Main] IPC: 'extensions:fetch-registry' called but ExtensionManager is not initialized."
      );
      return {
        success: false,
        error: "Extension manager not initialized",
        availableOnline: [],
      };
    }
    console.log("[Main] IPC: Handling 'extensions:fetch-registry'...");
    try {
      // We need the registry URL from config
      // It's better if ExtensionManager fetches it itself, maybe during initialization
      // or if the URL is passed to it. For now, let's assume index.ts calls it
      // after ExtensionManager is created. This handler might just return the current state.
      // Let's change the plan slightly: index.ts will call fetch, this handler
      // will return the currently available list.
      const onlineExtensions = extensionManager.getAvailableOnlineExtensions(); // Use public getter
      const availableOnline = Array.from(onlineExtensions.values());
      console.log(
        `[Main] IPC: Returning ${availableOnline.length} available online extensions.`
      );
      return { success: true, availableOnline };
    } catch (error: any) {
      console.error(`[Main] IPC: Error fetching online registry:`, error);
      return { success: false, error: error.message, availableOnline: [] };
    }
  });
  // --- End NEW ---

  // --- Installation/Uninstallation Handlers ---

  ipcMain.handle("install-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'install-extension' for ID: ${extensionId}`
    );
    try {
      await extensionManager.installMCPExtension(extensionId);
      // Return updated lists
      const managed = Array.from(
        extensionManager.getManagedExtensionsInfo().values()
      );
      const discoverable = extensionManager.getDiscoverableExtensionsInfo(); // This now returns ExtensionRegistryEntry[]
      const statuses = extensionManager.getManagedExtensionsStatus(); // Also return statuses
      const statusObj: Record<string, any> = {};
      statuses.forEach((value, key) => {
        statusObj[key] = value;
      });

      console.log(
        `[Main] IPC: Extension '${extensionId}' installed successfully.`
      );
      
      // Update tools via ToolService
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      // Return success for the installation, including updated lists/statuses
      return { success: true, managed, discoverable, statuses: statusObj };
    } catch (error: any) {
      console.error(
        `[Main] IPC: Error installing extension '${extensionId}':`,
        error
      );
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("uninstall-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'uninstall-extension' for ID: ${extensionId}`
    );
    try {
      await extensionManager.uninstallMCPExtension(extensionId);
      // Return updated lists
      const managed = Array.from(
        extensionManager.getManagedExtensionsInfo().values()
      );
      const discoverable = extensionManager.getDiscoverableExtensionsInfo(); // This now returns ExtensionRegistryEntry[]
      const statuses = extensionManager.getManagedExtensionsStatus(); // Also return statuses
      const statusObj: Record<string, any> = {};
      statuses.forEach((value, key) => {
        statusObj[key] = value;
      });

      console.log(
        `[Main] IPC: Extension '${extensionId}' uninstalled successfully.`
      );
      // Send updated tools list as uninstall disconnects
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      return { success: true, managed, discoverable, statuses: statusObj };
    } catch (error: any) {
      console.error(
        `[Main] IPC: Error uninstalling extension '${extensionId}':`,
        error
      );
      return { success: false, error: error.message };
    }
  });

  // --- Enable/Disable Handlers ---

  ipcMain.handle("enable-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'enable-extension' for ID: ${extensionId} using helper...`
    );

    // Call the helper function to handle enabling and notifications
    const result = await _tryEnableExtensionAndNotify(
      extensionManager,
      toolService,
      extensionId
    );

    // The helper function's return value directly matches the needs here
    // including success/error status and config error details.
    return result;
  });

  ipcMain.handle("disable-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'disable-extension' for ID: ${extensionId}`
    );
    try {
      await extensionManager.disableExtension(extensionId);
      const statuses = extensionManager.getManagedExtensionsStatus();
      const statusObj: Record<string, any> = {};
      statuses.forEach((value, key) => {
        statusObj[key] = value;
      });
      // Update tools via ToolService
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
      return { success: true, statuses: statusObj };
    } catch (error: any) {
      console.error(
        `[Main] IPC: Error disabling extension '${extensionId}':`,
        error
      );
      return { success: false, error: error.message };
    }
  });

  // --- Connection Management Handlers ---

  ipcMain.handle("reconnect-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'reconnect-extension' for ID: ${extensionId}`
    );
    try {
      await extensionManager.reconnectMCP(extensionId);
      // Return updated connection status
      const connectedInfo = Array.from(
        extensionManager.getSuccessfullyConnectedInfo().values()
      );
      // Send tool updates immediately
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
      return { success: true, connected: connectedInfo };
    } catch (error: any) {
      console.error(
        `[Main] IPC: Error reconnecting extension '${extensionId}':`,
        error
      );
      // --- Specific handling for config error ---
      if (error instanceof MCPExtensionConfigError) {
        console.warn(
          `[Main] IPC: Reconnecting extension '${extensionId}' failed due to missing configuration.`
        );
        getMainWindow()?.webContents.send("mcp-extension-config-required", {
          extensionId: error.extensionId,
          missingKeys: error.missingKeys,
        });
        return {
          success: false,
          error: error.message,
          requiresConfiguration: true,
          missingKeys: error.missingKeys,
        };
      }
      // --- End specific handling ---
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("connect-extension", async (_event, extensionId: string) => {
    if (!extensionManager)
      return { success: false, error: "Extension manager not initialized" };
    console.log(
      `[Main] IPC: Handling 'connect-extension' for ID: ${extensionId}`
    );
    try {
      await extensionManager.connectWithMCP(extensionId);
      const connectedInfo = Array.from(
        extensionManager.getSuccessfullyConnectedInfo().values()
      );
      console.log(
        `[Main] IPC: Extension '${extensionId}' connected successfully.`
      );
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
      return { success: true, connected: connectedInfo };
    } catch (error: any) {
      console.error(
        `[Main] IPC: Error connecting extension '${extensionId}':`,
        error
      );
      // --- Specific handling for config error ---
      if (error instanceof MCPExtensionConfigError) {
        console.warn(
          `[Main] IPC: Connecting extension '${extensionId}' failed due to missing configuration.`
        );
        getMainWindow()?.webContents.send("mcp-extension-config-required", {
          extensionId: error.extensionId,
          missingKeys: error.missingKeys,
        });
        return {
          success: false,
          error: error.message,
          requiresConfiguration: true,
          missingKeys: error.missingKeys,
        };
      }
      // --- End specific handling ---
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(
    "disconnect-extension",
    async (_event, extensionId: string) => {
      if (!extensionManager)
        return { success: false, error: "Extension manager not initialized" };
      console.log(
        `[Main] IPC: Handling 'disconnect-extension' for ID: ${extensionId}`
      );
      try {
        await extensionManager.disconnectMCP(extensionId);
        const connectedInfo = Array.from(
          extensionManager.getSuccessfullyConnectedInfo().values()
        );
        console.log(
          `[Main] IPC: Extension '${extensionId}' disconnected successfully.`
        );
        const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
        getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
        return { success: true, connected: connectedInfo };
      } catch (error: any) {
        console.error(
          `[Main] IPC: Error disconnecting extension '${extensionId}':`,
          error
        );
        return { success: false, error: error.message };
      }
    }
  );

  // --- Tools and Connections Handlers ---

  ipcMain.handle("get-all-active-tools", () => {
    if (!toolService) return [];
    console.log("[Main] IPC: Handling 'get-all-active-tools' via ToolService...");
    try {
      const tools = toolService.getAllActiveTools();
      const toolDefinitions = tools.map(mapToolToDefinition);
      return toolDefinitions;
    } catch (error: any) {
      console.error("[Main] IPC: Error getting all active tools from ToolService:", error);
      return [];
    }
  });

  ipcMain.handle("get-active-connections-info", () => {
    if (!extensionManager) return [];
    console.log("[Main] IPC: Handling 'get-active-connections-info'...");
    const infoMap = extensionManager.getSuccessfullyConnectedInfo();
    return Array.from(infoMap.values());
  });
}

/**
 * Registers handlers related to extension configuration UI and operations.
 */
function registerExtensionConfigHandlers(extensionManager: any): void {
  // --- Handler for Opening Extension Config UI --- DELETED (Handled by renderer via webview)

  // --- Handler for Closing the Config BrowserView --- DELETED (Handled by renderer via webview listener)

  // --- Handler for Getting Extension Config ---
  ipcMain.handle(
    "extensions:getConfig",
    async (_event, extensionId: string) => {
      console.log(`IPC: getConfig requested for ${extensionId}`);
      if (!extensionManager) return {}; // Handle case where manager isn't ready

      // Use the new method to get info for the managed extension
      const extensionInfo = extensionManager
        .getManagedExtensionsInfo()
        .get(extensionId);
      if (!extensionInfo) {
        console.error(
          `IPC: getConfig - Managed extension not found: ${extensionId}`
        );
        // It shouldn't be possible to request config for a non-managed extension
        // if openConfig prevents it, but handle defensively.
        throw new Error(`Managed extension not found: ${extensionId}`);
      }

      const configPath = path.join(extensionInfo.path, "config.json");
      console.log(`IPC: Reading config from ${configPath}`);

      try {
        const configData = await fs.readFile(configPath, "utf-8");
        return JSON.parse(configData);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          console.log(
            `IPC: Config file not found for ${extensionId} at ${configPath}. Returning default empty object.`
          );
          return {}; // Return default empty object if config file doesn't exist
        }
        console.error(
          `IPC: Error reading config file for ${extensionId}: ${error.message}`
        );
        throw error; // Rethrow other errors
      }
    }
  );

  // --- Handler for Saving Extension Config ---
  // Define the specific result type for this handler
  interface SaveConfigResult {
    success: boolean; // True if validation passed and file was written
    error?: string;
    validationFailed?: boolean;
    missingKeys?: string[];
  }

  ipcMain.handle(
    "extensions:saveConfig",
    async (
      _event,
      extensionId: string,
      configData: any
    ): Promise<SaveConfigResult> => {
      console.log(`IPC: saveConfig received for ${extensionId}`);
      if (!extensionManager) {
        return { success: false, error: "ExtensionManager not available." };
      }

      // 1. Pre-save Validation using the received data
      try {
        // Cast extensionManager to any temporarily if _validateConfiguration is private,
        // or make _validateConfiguration public/internal if preferred.
        // For now, assuming it can be called or casting.
        const validationResult = await (
          extensionManager as any
        )._validateConfiguration(extensionId, configData);
        if (!validationResult.isValid) {
          console.warn(
            `IPC: saveConfig validation failed for ${extensionId}. Missing: ${validationResult.missingKeys.join(", ")}`
          );
          return {
            success: false,
            error: `Configuration validation failed. Missing or invalid keys: ${validationResult.missingKeys.join(", ")}`,
            validationFailed: true,
            missingKeys: validationResult.missingKeys,
          };
        }
        console.log(
          `IPC: Pre-save configuration validation successful for ${extensionId}.`
        );
      } catch (validationError: any) {
        console.error(
          `IPC: Error during pre-save validation for ${extensionId}: ${validationError.message}`
        );
        return {
          success: false,
          error: `Validation error: ${validationError.message}`,
        };
      }

      // 2. Get Extension Info (needed for path)
      // We assume it must be managed if we are saving config for it.
      const extensionInfo = extensionManager
        .getManagedExtensionsInfo()
        .get(extensionId);
      if (!extensionInfo) {
        console.error(
          `IPC: saveConfig - Managed extension info not found for ${extensionId} after validation.`
        );
        // This case might indicate a state inconsistency.
        return {
          success: false,
          error: `Managed extension not found: ${extensionId}`,
        };
      }

      // 3. Basic data type check (redundant if validation passed, but safe)
      if (typeof configData !== "object" || configData === null) {
        console.error(
          `IPC: saveConfig - Invalid configData type received: ${typeof configData}`
        );
        return { success: false, error: "Invalid configuration data format." };
      }

      // 4. Save the validated configuration to file
      const configPath = path.join(extensionInfo.path, "config.json");
      console.log(`IPC: Writing config to ${configPath}`);

      try {
        await fs.writeFile(configPath, JSON.stringify(configData, null, 2)); // Pretty print JSON
        console.log(`IPC: Successfully saved config file for ${extensionId}`);
        // --- SUCCESS ---
        // Return simple success, DO NOT attempt enable here.
        return { success: true };
      } catch (error: any) {
        console.error(
          `IPC: Error writing config file for ${extensionId}: ${error.message}`
        );
        return {
          success: false,
          error: `Failed to save config file: ${error.message}`,
        };
      }

      // 5. REMOVED: Attempt to enable/connect extension
      // console.log(`IPC: Attempting to enable/connect extension ${extensionId} after saving config...`);
      // const enableResult = await _tryEnableExtensionAndNotify(extensionManager, extensionId);
      // Handle enableResult... (This logic is now removed)
    }
  );

  // --- Handler for Getting Extension Required Keys ---
  ipcMain.handle(
    "extensions:getRequiredKeys",
    async (_event, extensionId: string): Promise<string[]> => {
      console.log(`IPC: getRequiredKeys requested for ${extensionId}`);
      if (!extensionManager) {
        console.error("IPC: getRequiredKeys - ExtensionManager not available.");
        return []; // Return empty array or throw? Empty array seems safer.
      }

      // Get info (should be managed if config UI is open)
      const extensionInfo = extensionManager
        .getManagedExtensionsInfo()
        .get(extensionId);
      if (!extensionInfo) {
        console.error(
          `IPC: getRequiredKeys - Managed extension info not found: ${extensionId}`
        );
        return [];
      }

      // Extract and return the required keys from the manifest
      const requiredKeys =
        extensionInfo.manifest.configProcessing?.requiredConfigKeys ?? [];
      console.log(
        `IPC: Returning required keys for ${extensionId}:`,
        requiredKeys
      );
      return requiredKeys;
    }
  );

  // --- Handler for Selecting Directory ---
  ipcMain.handle(
    "extensions:selectDirectory",
    async (_event, options?: Electron.OpenDialogOptions) => {
      console.log("IPC: selectDirectory requested");
      // Use the current main window as the parent for the dialog
      const parentWindow = getMainWindow();
      if (!parentWindow) {
        console.error(
          "IPC: Could not find the main window to show the selectDirectory dialog."
        );
        return undefined;
      }

      const defaultOptions: Electron.OpenDialogOptions = {
        title: "Select Directory",
        properties: ["openDirectory", "multiSelections"], // Allow selecting multiple directories
      };

      const result = await dialog.showOpenDialog(parentWindow, {
        ...defaultOptions,
        ...options,
      });

      if (result.canceled) {
        console.log("IPC: Directory selection canceled.");
        return undefined;
      } else {
        console.log("IPC: Directories selected:", result.filePaths);
        return result.filePaths;
      }
    }
  );
}

// --- NEW: Handlers for Remote Integrations ---
function registerRemoteIntegrationHandlers(
  remoteIntegrationManager: RemoteIntegrationManager,
  toolService: ToolService
): void {
  console.log("[Main] IPC: Registering Remote Integration Handlers...");

  // Discover Pipedream Apps
  ipcMain.handle("remote-integrations:discover-pipedream-apps", async (_event, searchTerm?: string, pageToFetch?: number, category?: string): Promise<PipedreamAppDiscoveryResult> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:discover-pipedream-apps', searchTerm: ${searchTerm}, page: ${pageToFetch}, category: ${category}`);
    try {
      const discoveryResult = await remoteIntegrationManager.discoverPipedreamApps(searchTerm, pageToFetch, category);
      const configuredIntegrations = remoteIntegrationManager.getConfiguredIntegrations();
      const configuredSlugs = new Set(configuredIntegrations.map(ci => ci.name_slug));
      
      const trulyDiscoverableApps = discoveryResult.apps.filter(app => !configuredSlugs.has(app.name_slug));
      
      return {
        apps: trulyDiscoverableApps,
        pageInfo: discoveryResult.pageInfo
      };
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:discover-pipedream-apps': ${error.message}`);
      throw error; // Re-throw to be caught by invoke in renderer
    }
  });

  // Add a new configured remote integration
  ipcMain.handle("remote-integrations:add-configured", async (_event, appMetadata: PipedreamAppMetadata): Promise<PersistedRemoteIntegrationConfig> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:add-configured' for app: ${appMetadata.name_slug}`);
    try {
      const newConfig = await remoteIntegrationManager.addConfiguredIntegration(appMetadata, 'pipedream'); // Assuming 'pipedream' for now
      
      // Notify renderer of update
      const allConfigs = remoteIntegrationManager.getConfiguredIntegrations();
      getMainWindow()?.webContents.send("remote-integrations:configured-list-updated", allConfigs);
      
      return newConfig;
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:add-configured': ${error.message}`);
      throw error;
    }
  });

  // Get all configured remote integrations
  ipcMain.handle("remote-integrations:get-configured-list", async (): Promise<PersistedRemoteIntegrationConfig[]> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log("[Main] IPC: Handling 'remote-integrations:get-configured-list'");
    try {
      return remoteIntegrationManager.getConfiguredIntegrations();
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:get-configured-list': ${error.message}`);
      throw error;
    }
  });

  // Get details of a specific configured remote integration
  ipcMain.handle("remote-integrations:get-configured-details", async (_event, nameSlug: string): Promise<PersistedRemoteIntegrationConfig | undefined> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:get-configured-details' for slug: ${nameSlug}`);
    try {
      return remoteIntegrationManager.getConfiguredIntegration(nameSlug);
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:get-configured-details': ${error.message}`);
      throw error;
    }
  });

  // Enable a remote integration
  ipcMain.handle("remote-integrations:enable", async (_event, nameSlug: string, userId: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:enable' for slug: ${nameSlug}, userId: ${userId}`);
    
    try {
      // updateIntegrationEnabledStatus will now also attempt to connect if enabling.
      // It also handles the case where the integration is already enabled.
      await remoteIntegrationManager.updateIntegrationEnabledStatus(nameSlug, true, userId);

      // Refresh configured list for the renderer
      const allConfigs = remoteIntegrationManager.getConfiguredIntegrations();
      getMainWindow()?.webContents.send("remote-integrations:configured-list-updated", allConfigs);
      
      // Refresh tools for the renderer
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      // Send connection status update
      // updateIntegrationEnabledStatus internally calls connectIntegration, which should ideally
      // be responsible for sending its own detailed status update (success/failure with details).
      // However, to ensure the UI gets an immediate feedback from this handler, we check status here.
      const connInfo = remoteIntegrationManager.getActiveConnections().get(nameSlug);
      if (connInfo && connInfo.details.enabled) { // Check if actually enabled and connected
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: true,
              details: connInfo.details
          });
      } else {
          // If not connected after the attempt, send a disconnected status.
          // This could be because userId was missing for connect in updateIntegrationEnabledStatus,
          // or connectIntegration itself failed (it logs its own errors).
          const currentIntegrationConfig = remoteIntegrationManager.getConfiguredIntegration(nameSlug);
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: false,
              error: connInfo ? "Connection attempt might have failed, check logs." : "Integration not connected.",
              // Send basic details if available, even if not connected
              details: currentIntegrationConfig ? {
                  appId: currentIntegrationConfig.id,
                  nameSlug: currentIntegrationConfig.name_slug,
                  serviceType: currentIntegrationConfig.serviceType,
                  userId: userId, 
                  enabled: currentIntegrationConfig.enabled,
                  displayName: currentIntegrationConfig.name, // Use persisted name as fallback
                  iconUrl: currentIntegrationConfig.img_src, // Use persisted icon as fallback
                  actualMcpEndpoint: remoteIntegrationManager['_getMcpEndpoint']({ // Accessing private for status - consider a public getter
                    appId: currentIntegrationConfig.id, nameSlug: currentIntegrationConfig.name_slug, serviceType: currentIntegrationConfig.serviceType, userId: userId, enabled: currentIntegrationConfig.enabled, displayName: currentIntegrationConfig.name, actualMcpEndpoint: ''
                  })
              } : undefined
          });
      }
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:enable': ${error.message}`);
       getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false,
          error: error.message
      });
      throw error; // Re-throw to be caught by invoke in renderer
    }
  });
  
  // Disable a remote integration
  ipcMain.handle("remote-integrations:disable", async (_event, nameSlug: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:disable' for slug: ${nameSlug}`);
    try {
      await remoteIntegrationManager.disableIntegration(nameSlug); // This should handle disconnect and save

      const allConfigs = remoteIntegrationManager.getConfiguredIntegrations();
      getMainWindow()?.webContents.send("remote-integrations:configured-list-updated", allConfigs);

      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
      
      getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false,
      });
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:disable': ${error.message}`);
       getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false, 
          error: error.message
      });
      throw error;
    }
  });

  // Remove a configured remote integration
  ipcMain.handle("remote-integrations:remove-configured", async (_event, nameSlug: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:remove-configured' for slug: ${nameSlug}`);
    try {
      await remoteIntegrationManager.removeConfiguredIntegration(nameSlug); 
      
      const allConfigs = remoteIntegrationManager.getConfiguredIntegrations();
      getMainWindow()?.webContents.send("remote-integrations:configured-list-updated", allConfigs);

      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

       getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false, 
      });
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:remove-configured': ${error.message}`);
      throw error;
    }
  });

  // Explicitly connect an already configured and enabled remote integration
  ipcMain.handle("remote-integrations:connect", async (_event, nameSlug: string, userId: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:connect' for slug: ${nameSlug}`);
    try {
      await remoteIntegrationManager.connectIntegration(nameSlug, userId);

      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      const connInfo = remoteIntegrationManager.getActiveConnections().get(nameSlug);
       if (connInfo) {
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: true,
              details: connInfo.details
          });
      } else {
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: false,
              error: "Failed to establish connection."
          });
      }
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:connect': ${error.message}`);
       getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false,
          error: error.message
      });
      throw error;
    }
  });

  // Explicitly disconnect a remote integration
  ipcMain.handle("remote-integrations:disconnect", async (_event, nameSlug: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    console.log(`[Main] IPC: Handling 'remote-integrations:disconnect' for slug: ${nameSlug}`);
    try {
      await remoteIntegrationManager.disconnectIntegration(nameSlug);
      
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false,
      });
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:disconnect': ${error.message}`);
       getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false, 
          error: error.message
      });
      throw error;
    }
  });

  // Get information about currently connected remote integrations
  ipcMain.handle("remote-integrations:get-connected-info", async (): Promise<RuntimeRemoteIntegrationDetails[]> => {
      if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
      console.log("[Main] IPC: Handling 'remote-integrations:get-connected-info'");
      try {
        return remoteIntegrationManager.getConnectedIntegrationsInfo();
      } catch (error: any) {
        console.error(`[Main] IPC Error in 'remote-integrations:get-connected-info': ${error.message}`);
        throw error;
      }
  });

  // NEW: Handler to initialize connections for all enabled remote integrations (post-login)
  ipcMain.handle("remote-integrations:initialize-all-enabled", async (_event, userId: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    if (!userId) throw new Error("Cannot initialize remote integrations: userId is required.");

    console.log(`[Main] IPC: Handling 'remote-integrations:initialize-all-enabled' for userId: ${userId}`);
    try {
      await remoteIntegrationManager.connectAllEnabledIntegrations(userId);
      console.log(`[Main] IPC: Finished attempts to connect all enabled remote integrations for userId: ${userId}.`);

      // Notify renderer that tools might have changed
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);
      
      // Optionally, send a specific status update or rely on individual connection status events.
      // For now, just logging completion. The UI should update based on individual connection statuses
      // sent by connectIntegration (if any) or by polling get-configured-list/get-connected-info.

    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:initialize-all-enabled': ${error.message}`);
      // Decide if this error should be re-thrown to the renderer.
      // For now, logging it here. The renderer might not need to know about a full failure if individual successes still occur.
      throw error; // Re-throw for now so renderer is aware of a general failure in the process.
    }
  });

  // Handler for reconnecting a specific remote integration
  ipcMain.handle("remote-integrations:reconnect", async (_event, nameSlug: string, userId: string): Promise<void> => {
    if (!remoteIntegrationManager) throw new Error("RemoteIntegrationManager not initialized");
    if (!userId) throw new Error("Cannot reconnect remote integration: userId is required.");

    console.log(`[Main] IPC: Handling 'remote-integrations:reconnect' for slug: ${nameSlug}, userId: ${userId}`);
    try {
      await remoteIntegrationManager.reconnectIntegration(nameSlug, userId);
      console.log(`[Main] IPC: Successfully initiated reconnect for remote integration '${nameSlug}'.`);

      // Notify renderer that tools might have changed
      const allToolDefinitions = toolService.getAllActiveTools().map(mapToolToDefinition);
      getMainWindow()?.webContents.send("tools-updated", allToolDefinitions);

      // Send connection status update after reconnect attempt
      const connInfo = remoteIntegrationManager.getActiveConnections().get(nameSlug);
      if (connInfo && connInfo.tools.length > 0) { // Check if connected and tools loaded
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: true,
              details: connInfo.details
          });
      } else {
          const currentIntegrationConfig = remoteIntegrationManager.getConfiguredIntegration(nameSlug);
          getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
              nameSlug,
              connected: false,
              error: connInfo ? "Reconnect attempt might have failed, check logs." : "Integration not connected after reconnect.",
              details: currentIntegrationConfig ? {
                  appId: currentIntegrationConfig.id,
                  nameSlug: currentIntegrationConfig.name_slug,
                  serviceType: currentIntegrationConfig.serviceType,
                  userId: userId, 
                  enabled: currentIntegrationConfig.enabled,
                  displayName: currentIntegrationConfig.name,
                  iconUrl: currentIntegrationConfig.img_src,
                  actualMcpEndpoint: remoteIntegrationManager['_getMcpEndpoint']({
                      appId: currentIntegrationConfig.id, nameSlug: currentIntegrationConfig.name_slug, 
                      serviceType: currentIntegrationConfig.serviceType, userId: userId, 
                      enabled: currentIntegrationConfig.enabled, displayName: currentIntegrationConfig.name, 
                      actualMcpEndpoint: '' // Placeholder, as it's built dynamically
                  })
              } : undefined
          });
      }
    } catch (error: any) {
      console.error(`[Main] IPC Error in 'remote-integrations:reconnect' for ${nameSlug}: ${error.message}`);
      // Send a specific error status to the UI
      getMainWindow()?.webContents.send("remote-integrations:connection-status-updated", {
          nameSlug,
          connected: false,
          error: `Reconnect failed: ${error.message}`
      });
      throw error; // Re-throw to be caught by invoke in renderer if needed
    }
  });

  console.log("[Main] IPC: Remote Integration Handlers Registered.");
}

/**
 * Registers handler for system information
 */
function registerSystemInfoHandler(): void {
  ipcMain.handle("system:get-info", (): SystemInfo => {
    console.log("[Main] IPC: Handling 'system:get-info'");
    
    try {
      // Get CPU information
      const cpus = os.cpus();
      const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024));
      
      // Create the system info object
      const systemInfo: SystemInfo = {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: cpus.map(cpu => ({
          model: cpu.model,
          speed: cpu.speed
        })),
        totalMemoryMB,
        username: os.userInfo().username
      };
      
      return systemInfo;
    } catch (error) {
      console.error("[Main] Error getting system information:", error);
      // Return minimal information that's unlikely to fail
      return {
        platform: process.platform,
        release: "unknown",
        arch: process.arch,
        hostname: "unknown",
        totalMemoryMB: 0
      };
    }
  });
}
