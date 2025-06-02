import { contextBridge, ipcRenderer } from 'electron';

console.log("--- Config Preload Script START ---"); // Log start

// --- Get Extension ID from URL hostname ---
let extensionId: string | null = null;
console.log(`[Preload] Current window.location: ${window.location.href}`); // Log URL
if (window.location.protocol === 'ext-asset:') {
    extensionId = window.location.hostname; // e.g., 'gsuite' from ext-asset://gsuite/index.html
    console.log(`[Preload] Extracted extensionId: ${extensionId} from hostname`);
} else {
    // This case should not happen when loaded via <webview> with ext-asset://
    // but keep a log for debugging unusual scenarios.
    console.warn(`[Preload] Loaded with unexpected protocol: ${window.location.protocol}`);
}

if (!extensionId) {
    console.error("[Preload] Could not determine Extension ID from URL!", window.location.href);
} else {
    console.log(`[Preload] Using Extension ID: ${extensionId}`);
}

// Note: extensionPath is no longer passed/needed here, remove if not used by frontend

// --- Expose specific IPC channels securely ---
try {
    contextBridge.exposeInMainWorld('configApi', {
        getExtensionId: () => extensionId, // Expose the determined ID
        // getExtensionPath: () => extensionPath, // Remove if no longer needed

        // Function to get the current configuration from the main process
        getConfig: async (): Promise<any> => {
            if (!extensionId) throw new Error("Extension ID not available in preload.");
            try {
                console.log(`Preload: Invoking extensions:getConfig for ${extensionId}`);
                const config = await ipcRenderer.invoke('extensions:getConfig', extensionId);
                console.log(`Preload: Received config for ${extensionId}:`, config);
                return config;
            } catch (error) {
                console.error(`Preload: Error invoking extensions:getConfig for ${extensionId}:`, error);
                throw error; // Re-throw to be caught by frontend
            }
        },

        // Function to save the configuration via the main process
        saveConfig: async (configData: any): Promise<{ success: boolean; error?: string; validationFailed?: boolean; missingKeys?: string[] }> => {
            if (!extensionId) throw new Error("Extension ID not available in preload.");
            try {
                console.log(`Preload: Invoking extensions:saveConfig for ${extensionId} with data:`, configData);
                // The invoke call now returns the simpler SaveConfigResult
                const result = await ipcRenderer.invoke('extensions:saveConfig', extensionId, configData);
                console.log(`Preload: Save config result for ${extensionId}:`, result);
                
                // Send notification to host ONLY on successful save
                if (result.success) { 
                    console.log(`[Preload] Config save invoke result was success: true. Preparing to send 'config-save-success' to host.`);
                    ipcRenderer.sendToHost('config-save-success'); 
                    console.log(`[Preload] Sent 'config-save-success' to host.`);
                } else {
                    console.log(`[Preload] Config save invoke result was NOT success. No message sent to host.`);
                }
                
                // Return the result (including potential validation errors) to the webview caller
                return result;
            } catch (error) {
                console.error(`Preload: Error invoking extensions:saveConfig for ${extensionId}:`, error);
                // If invoke itself fails network-wise etc.
                return { success: false, error: error instanceof Error ? error.message : String(error) };
            }
        },

        // Example: Request the main process to show a directory selection dialog
        selectDirectory: async (options?: Electron.OpenDialogOptions): Promise<string[] | undefined> => {
            console.log("Preload: Invoking extensions:selectDirectory");
            // Requires a corresponding handler in main.ts using dialog.showOpenDialog
            const result = await ipcRenderer.invoke('extensions:selectDirectory', options);
            console.log("Preload: selectDirectory result:", result);
            return result;
        },

        // Modified: Function to tell the *host renderer* (via webview) to close this view
        closeConfig: () => {
            if (!extensionId) {
                console.error("Preload closeConfig: Cannot send close message, extensionId is missing.");
                return;
            }
            console.log(`Preload: Sending close-my-config-view to host for ${extensionId}`);
            // Send message to the renderer process hosting this webview
            ipcRenderer.sendToHost('close-my-config-view');
            // DO NOT send 'extensions:closeConfig' to main process anymore
        },
        
        // New function: Get required configuration keys
        getRequiredConfigKeys: async (): Promise<string[]> => {
            if (!extensionId) throw new Error("Extension ID not available in preload.");
            try {
                console.log(`Preload: Invoking extensions:getRequiredKeys for ${extensionId}`);
                const keys = await ipcRenderer.invoke('extensions:getRequiredKeys', extensionId);
                console.log(`Preload: Received required keys for ${extensionId}:`, keys);
                return keys;
            } catch (error) {
                console.error(`Preload: Error invoking extensions:getRequiredKeys for ${extensionId}:`, error);
                throw error; // Re-throw to be caught by frontend
            }
        }
    });
    console.log("[Preload] configApi EXPOSED successfully on window."); // Log success
} catch (error) {
    console.error("[Preload] FAILED to expose configApi:", error); // Log failure
}

console.log("--- Config Preload Script END ---"); // Log end 