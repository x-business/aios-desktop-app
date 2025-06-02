import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { loadMcpTools } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { is } from '@electron-toolkit/utils'; // Import is for is.dev check
import { app } from 'electron'; // Import app
import axios from 'axios'; // Import axios
import extract from 'extract-zip'; // Try default import for extract-zip
// Import shared types
import type { ExtensionRegistryEntry } from '@shared/types/index.js';

// --- Helper function for runtime path ---
function getBundledRuntimePath(relativePath: string): string {
    return is.dev ? path.join(process.cwd(), relativePath) : path.join(process.resourcesPath, relativePath);
}

// --- Configuration ---
// Use userData path for user-specific, writable data
const USER_DATA_PATH = app.getPath('userData'); 
// Main directory where all downloaded/managed MCP extensions reside
const EXTENSIONS_ROOT_PATH = path.join(USER_DATA_PATH, 'mcp-extensions'); 
// Metadata file tracking managed extensions within the user's mcp-extensions directory
const METADATA_FILE_PATH = path.join(EXTENSIONS_ROOT_PATH, 'extensions.json');

// --- Interfaces ---

/**
 * Structure of the data stored for each managed extension in extensions.json
 */
interface ManagedExtensionStatus {
    id: string;
    version: string; // Version when it was managed
    enabled: boolean; // Whether to auto-connect
}

/**
 * Information read from the manifest.json of an MCP extension.
 * Represents the static definition of the extension.
 */
interface MCPExtensionManifest {
    name: string; // Unique identifier (should match folder name ideally)
    version: string; // SemVer (e.g., "1.0.0")
    displayName: string; // User-friendly name
    description?: string; // Optional explanation
    runtime: 'node' | 'python'; // Runtime required
    executable: string; // Relative path to the main script/binary
    frontend: string; // Relative path to the main HTML UI file for configuration
    icon?: string; // Optional icon file name within the extension folder
    args?: string[]; // Optional default command-line arguments
    // configSchema?: object; // Optional JSON schema for config.json validation (Future Use)
    // --- NEW: Defines how config.json maps to runtime arguments/environment ---
    configProcessing?: {
        positionalConfigKey?: string; // Key in config.json holding an array for positional args
        namedArgsMappings?: Record<string, string>; // Maps config.json keys to named arg flags (e.g., {"logLevel": "--log-level"})
        envMappings?: Record<string, string>; // Maps config.json keys to environment variable names (e.g., {"apiKey": "API_KEY"})
        requiredConfigKeys?: string[]; // List of keys from config.json that MUST exist and be non-null/non-empty array
    };
    // Add other potential static fields here
}

/**
 * Represents discovered MCP extension metadata, primarily from its manifest.
 */
export interface MCPExtensionInfo {
    id: string; // Unique identifier, usually the folder name
    path: string; // Full path to the extension's directory
    manifest: MCPExtensionManifest; // Parsed manifest data
    iconPath?: string; // Full path to the icon, if specified and valid
}

/**
 * Represents an actively connected MCP extension.
 */
interface ActiveMCPExtension {
    info: MCPExtensionInfo;
    client: Client;
    transport: StdioClientTransport;
    tools: StructuredToolInterface[];
    connectionPromise: Promise<void>; // To track ongoing connection attempts
}

// --- Error Class ---
export class MCPExtensionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MCPExtensionError';
    }
}

/**
 * Error indicating that an extension requires configuration before connection.
 */
export class MCPExtensionConfigError extends MCPExtensionError {
    public readonly missingKeys: string[];
    public readonly extensionId: string;

    constructor(message: string, extensionId: string, missingKeys: string[]) {
        super(message);
        this.name = 'MCPExtensionConfigError';
        this.extensionId = extensionId;
        this.missingKeys = missingKeys;
    }
}

// --- Extension Manager Class ---

export class ExtensionManager {
    // Holds info from manifest.json for ALL valid extensions found in EXTENSIONS_ROOT_PATH
    private discoveredExtensions: Map<string, MCPExtensionInfo> = new Map();
    // Holds status loaded from extensions.json for MANAGED extensions
    private managedExtensionsStatus: Map<string, ManagedExtensionStatus> = new Map();
    // Holds active MCP connections
    private activeConnections: Map<string, ActiveMCPExtension> = new Map();
    // Holds available extensions fetched from the online registry
    private availableOnlineExtensions: Map<string, ExtensionRegistryEntry> = new Map();

    constructor() {
        console.log(`MCP Extensions Root Path: ${EXTENSIONS_ROOT_PATH}`);
        console.log(`MCP Extensions Metadata File: ${METADATA_FILE_PATH}`);
        // Ensure the root directory exists
        this._ensureDirectory(EXTENSIONS_ROOT_PATH)
            .then(() => this._loadMetadata()) // Load metadata after ensuring dir exists
            .catch(console.error);
    }

    /**
     * Ensures a directory exists.
     * @param directoryPath The path to ensure.
     */
    private async _ensureDirectory(directoryPath: string): Promise<void> {
        try {
            await fsPromises.mkdir(directoryPath, { recursive: true });
            console.log(`Ensured MCP extension directory exists: ${directoryPath}`);
        } catch (error: any) {
            console.error(`Error creating MCP extension directory ${directoryPath}: ${error.message}`);
            // Decide how to handle this - throw, log, etc.
        }
    }

    /**
     * Reads the extensions.json metadata file.
     * Populates the internal managedExtensionsStatus map.
     */
    private async _loadMetadata(): Promise<void> {
        try {
            console.log(`Reading metadata file: ${METADATA_FILE_PATH}`);
            const data = await fsPromises.readFile(METADATA_FILE_PATH, 'utf-8');
            const jsonObject = JSON.parse(data);

            // Basic validation: Ensure it's an object
            if (typeof jsonObject !== 'object' || jsonObject === null) {
                 throw new Error('Metadata content is not a valid JSON object.');
            }

            const loadedStatus = new Map<string, ManagedExtensionStatus>();
            for (const id in jsonObject) {
                if (Object.prototype.hasOwnProperty.call(jsonObject, id)) {
                    const entry = jsonObject[id];
                    // Validate entry structure (add more checks as needed)
                    if (entry && typeof entry.id === 'string' && entry.id === id && typeof entry.version === 'string' && typeof entry.enabled === 'boolean') {
                        loadedStatus.set(id, { 
                            id: entry.id,
                            version: entry.version,
                            enabled: entry.enabled
                        });
                    } else {
                        console.warn(`Skipping invalid entry in extensions.json for id: ${id}`);
                    }
                }
            }
            this.managedExtensionsStatus = loadedStatus;
            console.log(`Successfully loaded metadata for ${this.managedExtensionsStatus.size} extensions.`);
        
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`Metadata file (${METADATA_FILE_PATH}) not found. Initializing empty status map. Will be created on first install.`);
                this.managedExtensionsStatus = new Map();
            } else if (error instanceof SyntaxError) {
                 console.error(`Error parsing metadata file (${METADATA_FILE_PATH}): ${error.message}. Initializing empty status map.`);
                 this.managedExtensionsStatus = new Map();
            } else {
                console.error(`Error reading metadata file (${METADATA_FILE_PATH}): ${error.message}. Initializing empty status map.`);
                this.managedExtensionsStatus = new Map();
            }
        }
    }

    /**
     * Writes the current managedExtensionsStatus map to the extensions.json file.
     */
    private async _writeMetadata(): Promise<void> {
        try {
            const jsonObject: Record<string, ManagedExtensionStatus> = {};
            for (const [id, status] of this.managedExtensionsStatus.entries()) {
                jsonObject[id] = status;
            }
            const data = JSON.stringify(jsonObject, null, 2); // Pretty print
            await fsPromises.writeFile(METADATA_FILE_PATH, data, 'utf-8');
            console.log(`Successfully wrote metadata file: ${METADATA_FILE_PATH}`);
        } catch (error: any) {
            console.error(`Error writing metadata file (${METADATA_FILE_PATH}): ${error.message}`);
            // Consider how to handle write errors - maybe retry? Notify user?
            throw new MCPExtensionError(`Failed to write extension metadata: ${error.message}`);
        }
    }

    /**
     * Scans the EXTENSIONS_ROOT_PATH (in userData) for valid MCP extensions based on manifest.json.
     * Populates the internal discoveredExtensions map.
     */
    private async _scanLocalDirectory(): Promise<void> {
        console.log(`Scanning local directory for extensions: ${EXTENSIONS_ROOT_PATH}`);
        const discovered = new Map<string, MCPExtensionInfo>();
        try {
            const entries = await fsPromises.readdir(EXTENSIONS_ROOT_PATH, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const extensionId = entry.name;
                    const extensionPath = path.join(EXTENSIONS_ROOT_PATH, extensionId);
                    const manifestPath = path.join(extensionPath, 'manifest.json');
                    try {
                        await fsPromises.access(manifestPath, fs.constants.R_OK);
                        const manifestContent = await fsPromises.readFile(manifestPath, 'utf-8');
                        const manifest: MCPExtensionManifest = JSON.parse(manifestContent);

                        // Basic validation
                        if (!manifest.name || !manifest.version || !manifest.displayName || !manifest.runtime || !manifest.executable || !manifest.frontend) {
                            console.warn(`Skipping invalid/incomplete manifest in ${manifestPath}`);
                            continue;
                        }
                        if (manifest.runtime !== 'node' && manifest.runtime !== 'python') {
                             console.warn(`Skipping manifest ${manifestPath} due to invalid runtime: ${manifest.runtime}`);
                             continue;
                        }
                         // Optional: Check if manifest.name matches extensionId (folder name)
                         if (manifest.name !== extensionId) {
                             console.warn(`Manifest name '${manifest.name}' does not match folder name '${extensionId}' in ${manifestPath}. Using folder name as ID.`);
                         }

                        let validIconPath: string | undefined = undefined;
                        if (manifest.icon) {
                            const potentialIconPath = path.join(extensionPath, manifest.icon);
                            try {
                                await fsPromises.access(potentialIconPath, fs.constants.R_OK);
                                validIconPath = potentialIconPath;
                            } catch {
                                console.warn(`Icon specified in manifest but not found/readable: ${potentialIconPath}`);
                            }
                        }

                        const extensionInfo: MCPExtensionInfo = {
                            id: extensionId,
                            path: extensionPath,
                            manifest: manifest,
                            iconPath: validIconPath,
                        };
                        discovered.set(extensionId, extensionInfo);
                         console.log(`Discovered extension: ${extensionId} (Name: ${manifest.displayName})`);
                    } catch (err: any) {
                         if (err.code === 'ENOENT') { /* Expected if no manifest */ }
                         else if (err instanceof SyntaxError) { console.error(`Error parsing manifest.json for ${extensionId}: ${err.message}`); }
                         else { console.error(`Error reading manifest for ${extensionId}: ${err.message}`); }
                    }
                }
            }
        } catch (err: any) {
            if (err.code === 'ENOENT') { console.warn(`Extensions directory not found: ${EXTENSIONS_ROOT_PATH}`); await this._ensureDirectory(EXTENSIONS_ROOT_PATH); }
            else { console.error(`Error scanning directory ${EXTENSIONS_ROOT_PATH}: ${err.message}`); }
        }
        this.discoveredExtensions = discovered; // Update the class member
        console.log(`Finished scan. Discovered ${this.discoveredExtensions.size} potential extensions.`);
    }

    /**
     * Fetches the extension registry from the specified URL and updates the internal state.
     * @param registryUrl The URL of the registry.json file.
     */
    async fetchOnlineRegistry(registryUrl: string): Promise<void> {
        console.log(`[ExtensionManager] Fetching online extension registry from: ${registryUrl}`);
        try {
            const response = await axios.get<ExtensionRegistryEntry[]>(registryUrl, {
                // Ensure axios doesn't try to parse JSON automatically if the content-type isn't perfect
                // but expect an array of ExtensionRegistryEntry objects.
                responseType: 'json', 
                // Add timeout
                timeout: 15000 // 15 seconds timeout
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch registry: Status code ${response.status}`);
            }

            const registryEntries = response.data;

            // Basic validation: Check if it's an array
            if (!Array.isArray(registryEntries)) {
                 throw new Error('Invalid registry format: Expected an array of extensions.');
            }

            const newOnlineExtensions = new Map<string, ExtensionRegistryEntry>();
            let validEntries = 0;
            for (const entry of registryEntries) {
                // Basic validation for each entry (add more checks as needed)
                if (entry && typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.version === 'string' && typeof entry.downloadUrls === 'object' && entry.downloadUrls !== null) {
                    newOnlineExtensions.set(entry.id, entry);
                    validEntries++;
                } else {
                    console.warn(`[ExtensionManager] Skipping invalid entry in fetched registry:`, entry);
                }
            }

            this.availableOnlineExtensions = newOnlineExtensions;
            console.log(`[ExtensionManager] Successfully fetched and processed ${validEntries} valid online extension entries.`);
            // TODO: Maybe notify renderer that the online list is updated?

        } catch (error: any) {
            console.error(`[ExtensionManager] Error fetching or processing online extension registry: ${error.message}`);
            // Decide how to handle: Clear existing online list? Keep stale data? Log and continue?
            // For now, just log the error and potentially leave the old data.
            // You might want to clear it: this.availableOnlineExtensions.clear();
        }
    }

    /**
     * Gets the map of currently available online extensions fetched from the registry.
     * @returns A map of online extension IDs to their registry entries.
     */
    getAvailableOnlineExtensions(): Map<string, ExtensionRegistryEntry> {
        return this.availableOnlineExtensions;
    }

    // --- Private Download/Extract/Delete Helpers ---

    /**
     * Gets the appropriate download URL for the current platform.
     * @param entry The registry entry for the extension.
     * @returns The download URL string, or undefined if not available for the platform.
     */
    private _getDownloadUrlForPlatform(entry: ExtensionRegistryEntry): string | undefined {
        const platform = process.platform; // 'win32', 'darwin', 'linux' etc.
        console.log(`[ExtensionManager] Determining download URL for platform: ${platform}`);
        let url: string | undefined;
        switch (platform) {
            case 'win32': 
                url = entry.downloadUrls.win32;
                break;
            case 'darwin': 
                url = entry.downloadUrls.darwin;
                break;
            case 'linux': 
                url = entry.downloadUrls.linux;
                break;
            default: 
                 // Platform not explicitly listed, handled below
                 break;
        }

        // If platform-specific URL wasn't found, try the default
        if (!url && entry.downloadUrls.default) {
            console.log(`[ExtensionManager] Using default download URL for platform: ${platform}`);
            url = entry.downloadUrls.default;
        }
        
        // If still no URL after checking default, warn and return undefined
        if (!url) {
            console.warn(`[ExtensionManager] No specific or default download URL defined for platform: ${platform} for extension ${entry.id}`);
        }
        
        return url;
    }

    /**
     * Downloads an extension zip file from a URL and extracts it to the target directory.
     * @param downloadUrl The URL to download the zip file from.
     * @param targetDir The directory where the zip contents should be extracted.
     * @param extensionId The ID of the extension (for logging).
     */
    private async _downloadAndExtractExtension(downloadUrl: string, targetDir: string, extensionId: string): Promise<void> {
        console.log(`[ExtensionManager] Starting download for ${extensionId} from ${downloadUrl}`);
        const tempZipPath = path.join(app.getPath('temp'), `${extensionId}-${Date.now()}.zip`);
        const tempExtractDir = path.join(app.getPath('temp'), `${extensionId}-extract-${Date.now()}`);
        const writer = fs.createWriteStream(tempZipPath);

        try {
            // Download the file
            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 60000 // 60 second timeout for download
            });

            // Pipe the download stream to the file writer
            response.data.pipe(writer);

            // Wait for the download to finish
            await new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(undefined)); // Call resolve with undefined when writer finishes
                writer.on('error', reject); // reject is compatible
                response.data.on('error', reject); // Handle stream errors during download
            });
            console.log(`[ExtensionManager] Download complete for ${extensionId}. Saved to ${tempZipPath}`);

            // Ensure target directory exists
            await this._ensureDirectory(targetDir);

            // Extract the zip file to a temp directory first
            console.log(`[ExtensionManager] Extracting ${tempZipPath} to temp dir ${tempExtractDir}...`);
            await this._ensureDirectory(tempExtractDir);
            await extract(tempZipPath, { dir: tempExtractDir });
            console.log(`[ExtensionManager] Extraction to temp complete for ${extensionId}.`);

            // Check if the tempExtractDir contains a single directory
            const extractedEntries = await fsPromises.readdir(tempExtractDir, { withFileTypes: true });
            if (extractedEntries.length === 1 && extractedEntries[0].isDirectory()) {
                // Move contents of the single directory up to targetDir
                const singleDirName = extractedEntries[0].name;
                const singleDirPath = path.join(tempExtractDir, singleDirName);
                const innerEntries = await fsPromises.readdir(singleDirPath);
                for (const entry of innerEntries) {
                    const src = path.join(singleDirPath, entry);
                    const dest = path.join(targetDir, entry);
                    await fsPromises.rename(src, dest);
                }
                console.log(`[ExtensionManager] Moved contents of ${singleDirName} up to ${targetDir}`);
            } else {
                // Move all contents from tempExtractDir to targetDir
                for (const entry of extractedEntries) {
                    const src = path.join(tempExtractDir, entry.name);
                    const dest = path.join(targetDir, entry.name);
                    await fsPromises.rename(src, dest);
                }
                console.log(`[ExtensionManager] Moved all extracted files to ${targetDir}`);
            }
        } catch (error: any) {
            console.error(`[ExtensionManager] Error during download or extraction for ${extensionId}: ${error.message}`);
            // Clean up partially downloaded file if it exists
            await fsPromises.unlink(tempZipPath).catch(e => console.warn(`Failed to clean up temp zip file ${tempZipPath}: ${e.message}`));
            // Clean up temp extract dir
            await fsPromises.rm(tempExtractDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to clean up temp extract dir ${tempExtractDir}: ${e.message}`));
            throw new MCPExtensionError(`Failed to download or extract extension ${extensionId}: ${error.message}`);
        } finally {
            // Clean up the downloaded zip file and temp extract dir in all cases (success or handled error)
            await fsPromises.unlink(tempZipPath).catch(e => console.warn(`Failed to clean up temp zip file ${tempZipPath}: ${e.message}`));
            await fsPromises.rm(tempExtractDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to clean up temp extract dir ${tempExtractDir}: ${e.message}`));
        }
    }

    /**
     * Deletes the directory containing the extension files.
     * @param extensionId The ID of the extension whose files should be deleted.
     */
    private async _deleteExtensionFiles(extensionId: string): Promise<void> {
        const extensionPath = path.join(EXTENSIONS_ROOT_PATH, extensionId);
        console.log(`[ExtensionManager] Attempting to delete extension files at: ${extensionPath}`);
        try {
            await fsPromises.rm(extensionPath, { recursive: true, force: true });
            console.log(`[ExtensionManager] Successfully deleted directory: ${extensionPath}`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.warn(`[ExtensionManager] Directory not found, nothing to delete: ${extensionPath}`);
            } else {
                console.error(`[ExtensionManager] Error deleting extension directory ${extensionPath}: ${error.message}`);
                // Rethrow as a specific error type?
                throw new MCPExtensionError(`Failed to delete files for extension ${extensionId}: ${error.message}`);
            }
        }
    }

    // --- Public API ---

    /**
     * Scans the extensions directory and loads the metadata file.
     * Ensures the internal state (discoveredExtensions, managedExtensionsStatus) is current.
     */
    async discoverAndLoadExtensions(): Promise<void> {
        await this._scanLocalDirectory();
        await this._loadMetadata();
        // Optionally prune managed status if a discovered extension folder was deleted manually
        const discoveredIds = new Set(this.discoveredExtensions.keys());
        let metadataChanged = false;
        for (const managedId of this.managedExtensionsStatus.keys()) {
             if (!discoveredIds.has(managedId)) {
                 console.warn(`Managed extension '${managedId}' not found in directory. Removing from managed status.`);
                 this.managedExtensionsStatus.delete(managedId);
                 metadataChanged = true;
             }
         }
         if (metadataChanged) {
             await this._writeMetadata(); // Persist the cleanup
         }
    }

    /**
     * Gets information about extensions that are currently managed (listed in extensions.json)
     * and have a valid discovered manifest.
     * @returns A map of managed extension IDs to their info.
     */
    getManagedExtensionsInfo(): Map<string, MCPExtensionInfo> {
        const managedInfo = new Map<string, MCPExtensionInfo>();
        for (const id of this.managedExtensionsStatus.keys()) {
            const discovered = this.discoveredExtensions.get(id);
            if (discovered) {
                managedInfo.set(id, discovered);
            }
        }
        return managedInfo;
    }

     /**
     * Gets information about extensions that are available online (from the registry)
     * but are NOT currently managed locally (not listed in extensions.json).
     * @returns An array of ExtensionRegistryEntry objects for discoverable online extensions.
     */
    getDiscoverableExtensionsInfo(): ExtensionRegistryEntry[] {
        const discoverableOnline: ExtensionRegistryEntry[] = [];
        const managedIds = new Set(this.managedExtensionsStatus.keys());

        for (const [id, onlineEntry] of this.availableOnlineExtensions.entries()) {
            if (!managedIds.has(id)) {
                discoverableOnline.push(onlineEntry);
            }
        }
        console.log(`[ExtensionManager] Found ${discoverableOnline.length} discoverable (online, not managed) extensions.`);
        return discoverableOnline;
    }

     /**
      * Gets the status (enabled/disabled) for managed extensions.
      * @returns A map of managed extension IDs to their status.
      */
     getManagedExtensionsStatus(): Map<string, ManagedExtensionStatus> {
         return this.managedExtensionsStatus;
     }

    /**
     * Installs (downloads, extracts, and manages) an MCP extension from the online registry.
     * Updates the extensions.json file.
     * @param extensionId The ID (from registry entry) of the extension to install.
     * @returns The MCPExtensionInfo of the newly installed extension.
     */
    async installMCPExtension(extensionId: string): Promise<MCPExtensionInfo> {
        console.log(`[ExtensionManager] Attempting to install extension: ${extensionId}`);

        // 1. Check if already managed
        if (this.managedExtensionsStatus.has(extensionId)) {
            console.warn(`[ExtensionManager] Extension '${extensionId}' is already managed. Installation aborted.`);
            // Maybe return the existing info or throw an error?
            const existingInfo = this.discoveredExtensions.get(extensionId);
            if (existingInfo) return existingInfo; // Return existing info if found
            throw new MCPExtensionError(`Extension '${extensionId}' is already managed, but info not found.`);
        }

        // 2. Get registry entry
        const onlineEntry = this.availableOnlineExtensions.get(extensionId);
        if (!onlineEntry) {
            throw new MCPExtensionError(`Extension '${extensionId}' not found in the online registry.`);
        }

        // 3. Determine download URL
        const downloadUrl = this._getDownloadUrlForPlatform(onlineEntry);
        if (!downloadUrl) {
            throw new MCPExtensionError(`No suitable download URL found for extension '${extensionId}' on platform ${process.platform}.`);
        }

        // 4. Define target directory
        const targetDir = path.join(EXTENSIONS_ROOT_PATH, extensionId);

        // 5. Download and extract
        try {
            await this._downloadAndExtractExtension(downloadUrl, targetDir, extensionId);
        } catch (error: any) {
            console.error(`[ExtensionManager] Installation failed during download/extraction for ${extensionId}. Attempting cleanup.`);
            // Attempt to delete potentially partially extracted files
            await this._deleteExtensionFiles(extensionId).catch(e => console.error(`Cleanup failed for ${extensionId}: ${e.message}`));
            throw error; // Re-throw the original download/extraction error
        }

        // 6. Read manifest post-extraction (verify it exists and is valid)
        let installedManifest: MCPExtensionManifest;
        const manifestPath = path.join(targetDir, 'manifest.json');
        try {
            const manifestContent = await fsPromises.readFile(manifestPath, 'utf-8');
            installedManifest = JSON.parse(manifestContent);
            // Basic validation (add more as needed)
            if (!installedManifest.name || !installedManifest.version || !installedManifest.displayName || !installedManifest.runtime || !installedManifest.executable || !installedManifest.frontend) {
                throw new Error('Invalid or incomplete manifest.json found after installation.');
            }
            // Check if the installed manifest name matches the ID (optional but good practice)
            if (installedManifest.name !== extensionId) {
                console.warn(`[ExtensionManager] Installed manifest name '${installedManifest.name}' does not match expected ID '${extensionId}'. Proceeding with ID.`);
            }
            console.log(`[ExtensionManager] Successfully read manifest for ${extensionId} after installation. Version: ${installedManifest.version}`);
        } catch (error: any) {
            console.error(`[ExtensionManager] Failed to read or validate manifest for ${extensionId} after installation: ${error.message}. Cleaning up.`);
            await this._deleteExtensionFiles(extensionId).catch(e => console.error(`Cleanup failed for ${extensionId}: ${e.message}`));
            throw new MCPExtensionError(`Failed to validate installed extension ${extensionId}: ${error.message}`);
        }

        // 7. Add to managed status (using version from the *installed* manifest)
        const newStatus: ManagedExtensionStatus = {
            id: extensionId,
            version: installedManifest.version, 
            enabled: false,
        };
        this.managedExtensionsStatus.set(extensionId, newStatus);

        // 8. Persist metadata changes
        try {
            await this._writeMetadata();
            console.log(`[ExtensionManager] Successfully added '${extensionId}' (v${installedManifest.version}) to managed extensions.`);
        } catch (error) {
            // Rollback internal state changes if write failed
            this.managedExtensionsStatus.delete(extensionId);
            console.error(`[ExtensionManager] Failed to write metadata after installing ${extensionId}. Rolling back state. Error:`, error);
            // Clean up installed files as the install failed
            await this._deleteExtensionFiles(extensionId).catch(e => console.error(`Cleanup failed for ${extensionId} during rollback: ${e.message}`));
            throw error; // Rethrow the metadata write error
        }

        // 9. Refresh local discovery cache to include the new extension
        await this._scanLocalDirectory();

        // 10. Return the info for the newly installed extension
        const newlyDiscoveredInfo = this.discoveredExtensions.get(extensionId);
        if (!newlyDiscoveredInfo) {
            // This should not happen if scanLocalDirectory worked correctly after install
            console.error(`[ExtensionManager] CRITICAL: Extension ${extensionId} installed but not found in local discovery cache afterwards!`);
            throw new MCPExtensionError(`Installation inconsistency for ${extensionId}.`);
        }
        return newlyDiscoveredInfo;
    }

     /**
     * Uninstalls (stops managing and deletes files) an MCP extension.
     * Updates the extensions.json file.
     * @param extensionId The ID of the extension to uninstall.
     */
    async uninstallMCPExtension(extensionId: string): Promise<void> {
        console.log(`[ExtensionManager] Attempting to uninstall extension: ${extensionId}`);
        
        // 1. Disconnect if active
        if (this.activeConnections.has(extensionId)) {
             console.log(`[ExtensionManager] Disconnecting active connection for ${extensionId} before uninstalling...`);
            await this.disconnectMCP(extensionId); // Ensure it's disconnected first
        }

        // 2. Check if it's actually managed
        if (!this.managedExtensionsStatus.has(extensionId)) {
             console.warn(`[ExtensionManager] Extension '${extensionId}' is not currently managed. Cannot uninstall.`);
             // Refresh state just in case?
             await this.discoverAndLoadExtensions();
             if (!this.managedExtensionsStatus.has(extensionId)) {
                 // Still not found, attempt to delete files anyway if they exist
                 console.warn(`[ExtensionManager] Extension '${extensionId}' confirmed not managed. Attempting file deletion.`);
                 await this._deleteExtensionFiles(extensionId); 
                 return; 
             }
             console.log(`[ExtensionManager] Found extension ${extensionId} in managed list after refresh. Proceeding with uninstall.`);
        }

        // 3. Remove from managed status map
        this.managedExtensionsStatus.delete(extensionId);
        console.log(`[ExtensionManager] Removed '${extensionId}' from internal managed status map.`);

        // 4. Persist the metadata change *before* deleting files
        try {
            await this._writeMetadata();
            console.log(`[ExtensionManager] Successfully updated metadata file for uninstallation of '${extensionId}'.`);
        } catch (error) {
             // If write fails, should we proceed with deletion? Risky.
             // Rollback the internal state change.
             console.error(`[ExtensionManager] CRITICAL: Failed to write metadata before deleting ${extensionId}. Rolling back status change. Error:`, error);
             // Re-add to map (assuming we know the previous status, which we don't easily here)
             // For safety, maybe *don't* rollback but log prominently and throw?
             // Let's re-throw, preventing deletion if metadata fails.
             throw error;
        }

        // 5. Delete the extension files
        await this._deleteExtensionFiles(extensionId);
        
        // 6. Remove from the discovered extensions map if present
        if (this.discoveredExtensions.has(extensionId)) {
            this.discoveredExtensions.delete(extensionId);
            console.log(`[ExtensionManager] Removed '${extensionId}' from discovered extensions cache.`);
        }

        console.log(`[ExtensionManager] Uninstall complete for ${extensionId}.`);
        // TODO: IPC - Notify renderer of updated managed/discoverable lists (handled by IPC handler)
    }

    /**
     * Enables an extension, allowing it to be auto-connected on startup.
     * Updates the extensions.json file.
     * @param extensionId The ID of the extension to enable.
     */
    async enableExtension(extensionId: string): Promise<void> {
        console.log(`Attempting to enable extension: ${extensionId}`);

        // --- Check if managed --- 
        let status = this.managedExtensionsStatus.get(extensionId);
        if (!status) {
            console.warn(`Extension '${extensionId}' is not managed. Cannot enable.`);
             // Optionally rescan/reload?
             await this.discoverAndLoadExtensions();
             status = this.managedExtensionsStatus.get(extensionId);
             if (!status) {
                 throw new MCPExtensionError(`Extension '${extensionId}' not found or not managed.`);
             }
              console.log(`Found extension ${extensionId} after refresh. Proceeding with enable.`);
        } 
        
        if (status.enabled) {
            console.log(`Extension '${extensionId}' is already enabled.`);
            await this.reconnectMCP(extensionId);
            return;
        }

        // --- Validate configuration BEFORE enabling --- 
        const validationResult = await this._validateConfiguration(extensionId);
        if (!validationResult.isValid) {
            console.warn(`Cannot enable extension '${extensionId}': Configuration validation failed.`);
            throw new MCPExtensionConfigError(
                `Configuration required for extension '${extensionId}'. Missing or invalid keys: ${validationResult.missingKeys.join(', ')}`,
                extensionId,
                validationResult.missingKeys
            );
        }
        // ---------------------------------------------

        // Proceed with enabling if validation passed
        status.enabled = true;
        this.managedExtensionsStatus.set(extensionId, status);
        
        try {
            await this._writeMetadata();
            console.log(`Successfully saved enabled state for extension '${extensionId}'.`);

            try {
                 // --- Attempt to connect immediately after enabling --- 
                 console.log(`Attempting immediate connection for newly enabled extension ${extensionId}...`);
                 await this.connectWithMCP(extensionId); // Await the connection attempt
                 console.log(`Successfully connected ${extensionId} after enabling.`);
                 // TODO: IPC Notify renderer of enable & connect success
                 // -----------------------------------------------------
            } catch (connectError: any) {
                console.error(`Immediate connection failed for ${extensionId} after enabling: ${connectError.message}`);
                // --- ROLLBACK enabled state if connection failed immediately --- 
                console.warn(`Rolling back enabled state for ${extensionId} due to connection failure.`);
                const statusToRollback = this.managedExtensionsStatus.get(extensionId);
                 if (statusToRollback) {
                     statusToRollback.enabled = false; // Set back to disabled in memory
                     this.managedExtensionsStatus.set(extensionId, statusToRollback);
                     try {
                         await this._writeMetadata(); // Attempt to save the rollback
                         console.log(`Successfully rolled back enabled state in metadata for ${extensionId}.`);
                     } catch (rollbackError: any) {
                         // This is problematic - state might be inconsistent
                         console.error(`CRITICAL: Failed to write metadata during rollback for ${extensionId}: ${rollbackError.message}. State may be inconsistent.`);
                     }
                 }
                 // -----------------------------------------------------------------
                 // Rethrow the connection error so the enable operation is considered failed
                 throw connectError; 
            }
        } catch (writeError: any) {
             console.error(`Failed to write metadata while enabling ${extensionId}.`, writeError);
             // Rollback internal state if initial write failed
             const statusToRollback = this.managedExtensionsStatus.get(extensionId);
             if (statusToRollback) {
                 statusToRollback.enabled = false;
                 this.managedExtensionsStatus.set(extensionId, statusToRollback);
             }
             throw writeError; // Rethrow original write error
        }
    }

    /**
     * Disables an extension, preventing auto-connect and disconnecting if running.
     * Updates the extensions.json file.
     * @param extensionId The ID of the extension to disable.
     */
    async disableExtension(extensionId: string): Promise<void> {
        console.log(`Attempting to disable extension: ${extensionId}`);
        const status = this.managedExtensionsStatus.get(extensionId);

        if (!status) {
            console.warn(`Extension '${extensionId}' is not managed. Cannot disable.`);
            // Optionally rescan/reload?
             await this.discoverAndLoadExtensions();
             if (!this.managedExtensionsStatus.has(extensionId)) {
                  // If still not found after reload, it truly isn't managed.
                  console.log(`Extension '${extensionId}' confirmed not managed after refresh.`);
                  return; 
             }
              console.log(`Found extension ${extensionId} after refresh. Proceeding with disable check.`);
              // Re-fetch status after reload
              const refreshedStatus = this.managedExtensionsStatus.get(extensionId)!;
              if (!refreshedStatus.enabled) {
                  console.log(`Extension '${extensionId}' is already disabled.`);
                  return;
              }
              refreshedStatus.enabled = false;
              this.managedExtensionsStatus.set(extensionId, refreshedStatus);
        } else {
            if (!status.enabled) {
                console.log(`Extension '${extensionId}' is already disabled.`);
                return;
            }
            status.enabled = false;
            this.managedExtensionsStatus.set(extensionId, status);
        }
        
        // Disconnect if currently active
        if (this.activeConnections.has(extensionId)) {
            console.log(`Disconnecting active connection for disabled extension ${extensionId}...`);
            await this.disconnectMCP(extensionId);
        }

        try {
            await this._writeMetadata();
            console.log(`Successfully disabled extension '${extensionId}'.`);
             // TODO: IPC Notify renderer
        } catch (error) {
             console.error(`Failed to write metadata after disabling ${extensionId}. Attempting to roll back state.`, error);
             // Rollback internal state
             const rollbackStatus = this.managedExtensionsStatus.get(extensionId);
             if (rollbackStatus) {
                 rollbackStatus.enabled = true;
                 this.managedExtensionsStatus.set(extensionId, rollbackStatus);
                 // Should we try to reconnect if disconnect failed?? Probably not here.
             }
             throw error; // Rethrow original error
        }
    }

    // --- reconnectMCP needs to be INSIDE the class --- 
    /**
     * Attempts to reconnect to a managed and enabled extension.
     * Ensures any existing connection/attempt is cleaned up first.
     * @param extensionId The ID of the extension to reconnect to.
     */
    async reconnectMCP(extensionId: string): Promise<void> {
        console.log(`Attempting to reconnect to extension: ${extensionId}`);

        // 1. Check if managed and enabled
        const managedStatus = this.managedExtensionsStatus.get(extensionId);
        if (!managedStatus) {
            throw new MCPExtensionError(`Extension '${extensionId}' is not managed. Cannot reconnect.`);
        }
        if (!managedStatus.enabled) {
             throw new MCPExtensionError(`Extension '${extensionId}' is disabled. Cannot reconnect.`);
        }

        // --- 2. Validate configuration BEFORE attempting reconnect --- 
        const validationResult = await this._validateConfiguration(extensionId);
        if (!validationResult.isValid) {
             console.warn(`Cannot reconnect extension '${extensionId}': Configuration validation failed.`);
             throw new MCPExtensionConfigError(
                 `Configuration required for extension '${extensionId}'. Missing or invalid keys: ${validationResult.missingKeys.join(', ')}`,
                 extensionId,
                 validationResult.missingKeys
             );
        }
        // ---------------------------------------------------------

        // 3. Disconnect if currently active or connecting to ensure clean slate
        if (this.activeConnections.has(extensionId)) {
            console.log(`Disconnecting existing connection/attempt for ${extensionId} before reconnecting...`);
            // Use disconnectMCP which handles waiting for promises etc.
            await this.disconnectMCP(extensionId);
            console.log(`Disconnect complete for ${extensionId}. Proceeding with reconnect.`);
        } else {
             console.log(`No active connection found for ${extensionId}. Proceeding directly with connection attempt.`);
        }

        // 4. Attempt connection (connectWithMCP already checks managed/enabled again, but that's fine)
        // It will throw an error if the connection fails, which can be caught by the caller (IPC handler)
        try {
             await this.connectWithMCP(extensionId);
             console.log(`Reconnect attempt for ${extensionId} initiated successfully.`);
        } catch (error) {
            console.error(`Error during reconnect attempt for ${extensionId}:`, error);
            // Rethrow the error from connectWithMCP
            throw error;
        } 
    }
    // --- End of reconnectMCP ---

    /**
     * Validates if the extension's config.json satisfies the requirements 
     * specified in its manifest's configProcessing.requiredConfigKeys.
     * 
     * @param extensionId The ID of the extension to validate.
     * @param configDataToValidate Optional. If provided, validates this object directly instead of reading config.json.
     * @returns A promise resolving to an object { isValid: boolean; missingKeys: string[] }.
     */
    private async _validateConfiguration(
        extensionId: string, 
        configDataToValidate?: any
    ): Promise<{ isValid: boolean; missingKeys: string[] }> {
        console.log(`Validating configuration for extension: ${extensionId}${configDataToValidate ? ' (with provided data)' : ' (reading file)'}`);
        const extensionInfo = this.discoveredExtensions.get(extensionId);

        if (!extensionInfo) {
             // Should not typically happen if called after discovery/load
            console.error(`Validation failed: Extension info not found for ${extensionId}.`);
            return { isValid: false, missingKeys: ['_extensionNotFound_'] }; // Indicate a fundamental issue
        }

        const requiredKeys = extensionInfo.manifest.configProcessing?.requiredConfigKeys;
        const positionalKey = extensionInfo.manifest.configProcessing?.positionalConfigKey;

        // If no keys are required, validation passes
        if (!requiredKeys || requiredKeys.length === 0) {
            console.log(`No required configuration keys for ${extensionId}. Validation skipped.`);
            return { isValid: true, missingKeys: [] };
        }

        let userConfig: any;

        if (configDataToValidate !== undefined) {
            // Use provided data for validation
            userConfig = configDataToValidate;
            if (typeof userConfig !== 'object' || userConfig === null) {
                console.warn(`Configuration validation failed for ${extensionId}: Provided configData is not a valid JSON object.`);
                // If provided data is invalid, treat all required keys as missing
                return { isValid: false, missingKeys: requiredKeys || [] }; 
            }
        } else {
            // Read config from file
            const configPath = path.join(extensionInfo.path, 'config.json');
            try {
                const configContent = await fsPromises.readFile(configPath, 'utf-8');
                userConfig = JSON.parse(configContent);
                if (typeof userConfig !== 'object' || userConfig === null) {
                    throw new Error('Config file is not a valid JSON object.');
                }
            } catch (error: any) {
                console.warn(`Configuration validation failed for ${extensionId}: Error reading or parsing ${configPath}. Required keys considered missing. Error: ${error.message}`);
                // If config can't be read/parsed, all required keys are considered missing
                return { isValid: false, missingKeys: requiredKeys || [] }; 
            }
        }

        // Perform the actual validation using the determined userConfig
        const missingKeys: string[] = [];
        for (const key of requiredKeys) {
            let isMissing = false;

            if (userConfig[key] === undefined || userConfig[key] === null) {
                isMissing = true;
            }
            
            // Special check: If the required key is also the positional key (like allowedPaths),
            // ensure it's a non-empty array.
            if (!isMissing && key === positionalKey) {
                 if (!Array.isArray(userConfig[key]) || userConfig[key].length === 0) {
                     console.warn(`Validation check: Required key '${key}' (used as positional arg) is not a non-empty array.`);
                     isMissing = true;
                 }
            }

            if (isMissing) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            console.warn(`Configuration validation failed for ${extensionId}. Missing or invalid required keys: ${missingKeys.join(', ')}`);
            return { isValid: false, missingKeys: missingKeys };
        } else {
            console.log(`Configuration validation successful for ${extensionId}.`);
            return { isValid: true, missingKeys: [] };
        }
    }

    /**
     * Connects to a specific installed MCP extension server.
     * To be called by 'connectWithMCP' IPC handler.
     * @param extensionId The ID of the extension to connect to.
     */
    async connectWithMCP(extensionId: string): Promise<void> {
        // --- Pre-connection Checks --- 
        const managedStatus = this.managedExtensionsStatus.get(extensionId);
        if (!managedStatus) {
            // Should not happen if called correctly, but double-check
            throw new MCPExtensionError(`Extension '${extensionId}' is not managed. Cannot connect.`);
        }
        if (!managedStatus.enabled) {
             console.log(`Extension '${extensionId}' is disabled. Skipping connection.`);
             // Optionally throw an error or just return silently? Returning for now.
             // throw new MCPExtensionError(`Extension '${extensionId}' is disabled. Cannot connect.`);
             return; 
        }

        // --- Validate configuration BEFORE attempting connection --- 
        const validationResult = await this._validateConfiguration(extensionId);
        if (!validationResult.isValid) {
             console.warn(`Cannot connect extension '${extensionId}': Configuration validation failed.`);
             throw new MCPExtensionConfigError(
                 `Configuration required for extension '${extensionId}'. Missing or invalid keys: ${validationResult.missingKeys.join(', ')}`,
                 extensionId,
                 validationResult.missingKeys
             );
        }
        // ----------------------------------------------------

         const existingConnection = this.activeConnections.get(extensionId);
         if (existingConnection) {
             console.log(`Already connected or connecting to extension '${extensionId}'. Awaiting existing promise.`);
             // Wait for existing connection promise if it's still pending
             await existingConnection.connectionPromise;
              console.log(`Existing connection promise resolved for ${extensionId}.`);
             return; // Already handled
         }

        let extensionInfo = this.discoveredExtensions.get(extensionId);
        if (!extensionInfo) {
             console.log(`Extension ${extensionId} not in cache, rescanning installed...`)
             await this.discoverAndLoadExtensions(); // Refresh list
             extensionInfo = this.discoveredExtensions.get(extensionId);
             if(!extensionInfo) {
                throw new MCPExtensionError(`Extension '${extensionId}' not found in installed path ${EXTENSIONS_ROOT_PATH}. Cannot connect.`);
             }
             console.log(`Found extension ${extensionId} after rescan.`);
        }

        const info = extensionInfo; // Use the obtained info
        console.log(`Connecting to MCP extension: ${info.manifest.displayName} (${extensionId})`);

        // --- Prepare command and arguments from Manifest ---
        let relativeRuntimePath: string;
        if (info.manifest.runtime === 'node') {
            if (process.platform === 'win32') {
                relativeRuntimePath = 'external_runtimes/node-win-x64/node.exe';
            } else if (process.platform === 'darwin') {
                // Path for macOS (assuming universal2 build extracted into external_runtimes/node)
                relativeRuntimePath = 'external_runtimes/node-mac-arm64/bin/node'; 
            } else if (process.platform === 'linux') {
                // Keep the original Linux path (ensure this directory exists and is correct)
                relativeRuntimePath = 'external_runtimes/node-linux-x64/bin/node';
            } else {
                // Handle unsupported platforms if necessary
                throw new Error(`Unsupported platform: ${process.platform} for Node.js runtime`);
            }
        } else if (info.manifest.runtime === 'python') {
            if (process.platform === 'win32') {
                relativeRuntimePath = 'external_runtimes/python-win-x64/python.exe';
            } else if (process.platform === 'darwin') {
                // Path for macOS (assuming universal2 build extracted here)
                relativeRuntimePath = 'external_runtimes/python-mac-arm64/bin/python';
            } else if (process.platform === 'linux') {
                // Keep the original Linux path (ensure this directory exists and is correct)
                relativeRuntimePath = 'external_runtimes/python-linux-x64/bin/python';
            } else {
                // Handle unsupported platforms if necessary
                throw new Error(`Unsupported platform: ${process.platform} for Python runtime`);
            }
        } else {
            // Should ideally be caught during manifest validation, but handle defensively
             throw new MCPExtensionError(`Unsupported runtime '${info.manifest.runtime}' specified for extension ${extensionId}`);
        }

        const runtimeCommand = getBundledRuntimePath(relativeRuntimePath);
        console.log(`Resolved runtime command path: ${runtimeCommand}`);

        const executablePath = path.join(info.path, info.manifest.executable);
        const defaultArgs = info.manifest.args ?? []; // Use default args from manifest, or empty array

        // --- Load User Config and Generate Args/Env ---
        let userArgs: string[] = [];
        let userEnv: Record<string, string> = {}; // For environment variables
        const configPath = path.join(info.path, 'config.json');
        try {
            console.log(`Attempting to read config file: ${configPath}`);
            const configContent = await fsPromises.readFile(configPath, 'utf-8');
            const userConfig = JSON.parse(configContent); // Assuming root is an object

             // Process config based on manifest instructions
             const configProcessor = info.manifest.configProcessing;
             if (configProcessor && typeof userConfig === 'object' && userConfig !== null) {
                console.log(`Processing user config using manifest instructions:`, configProcessor);

                // 1. Positional Arguments
                if (configProcessor.positionalConfigKey && userConfig[configProcessor.positionalConfigKey]) {
                    const positionalKey = configProcessor.positionalConfigKey;
                    if (Array.isArray(userConfig[positionalKey])) {
                        const posArgs = userConfig[positionalKey].map((p: unknown) => String(p));
                        userArgs.push(...posArgs);
                         console.log(`  Added positional args from key '${positionalKey}': ${posArgs.join(', ')}`);
                    } else {
                         console.warn(`  Config key '${positionalKey}' for positional args is not an array in ${configPath}`);
                    }
                }

                // 2. Named Arguments
                if (configProcessor.namedArgsMappings) {
                    for (const [configKey, argName] of Object.entries(configProcessor.namedArgsMappings)) {
                        if (userConfig[configKey] !== undefined && userConfig[configKey] !== null) {
                             const argValue = String(userConfig[configKey]);
                             userArgs.push(argName, argValue);
                             console.log(`  Added named arg: ${argName} ${argValue} (from config key '${configKey}')`);
                        } else {
                            console.log(`  Skipping named arg ${argName} - key '${configKey}' not found or null/undefined in config.`);
                        }
                    }
                }

                // 3. Environment Variables
                if (configProcessor.envMappings) {
                    for (const [configKey, envName] of Object.entries(configProcessor.envMappings)) {
                        if (userConfig[configKey] !== undefined && userConfig[configKey] !== null) {
                            userEnv[envName] = String(userConfig[configKey]);
                             console.log(`  Added environment variable: ${envName}=${userEnv[envName]} (from config key '${configKey}')`);
                        } else {
                             console.log(`  Skipping env var ${envName} - key '${configKey}' not found or null/undefined in config.`);
                        }
                    }
                }
            } else {
                 console.log('No valid configProcessing instructions in manifest or config file is not a valid object.');
            }
            
            // Check if allowedPaths exists and is an array // --- REMOVE OLD Filesystem Specific Logic ---
            // if (userConfig && Array.isArray(userConfig.allowedPaths)) {
            //     console.log(`Found allowed paths: ${userConfig.allowedPaths.join(', ')}`);
            //     // Generate arguments as direct paths: ["/path/to/dir1", "/path/to/dir2"]
            //     userConfigArgs = userConfig.allowedPaths.map((p: unknown) => String(p)); // Ensure paths are strings
            // } else {
            //     console.log('No valid allowedPaths array found in config.json');
            // }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log(`Config file not found at ${configPath}. No user-specific arguments or env vars will be added.`);
            } else if (error instanceof SyntaxError) {
                 console.error(`Error parsing config.json at ${configPath}: ${error.message}. No user-specific arguments or env vars will be added.`);
            } else {
                console.error(`Error reading config file ${configPath}: ${error.message}. No user-specific arguments or env vars will be added.`);
            }
            // Ensure userArgs/userEnv remain empty on error
            userArgs = [];
            userEnv = {};
        }
        // -------------------------------------------

        // Combine default args and user-specific args
        const finalArgs = [...defaultArgs, ...userArgs];

        console.log(`  Runtime: ${info.manifest.runtime} (Using command: ${runtimeCommand})`); // Log placeholder command for now
        console.log(`  Executable: ${executablePath}`);
        console.log(`  Final Arguments: ${finalArgs.join(' ')}`);
        console.log(`  Environment Variables (User defined):`, userEnv);
        console.log(`  CWD: ${info.path}`);

        const transport = new StdioClientTransport({
            command: runtimeCommand, // Use the determined runtime command (NEEDS PATH RESOLUTION)
            args: [executablePath, ...finalArgs], // Pass executable as first arg, then combined args
            cwd: info.path, // Run the command from the extension's directory
            env: Object.entries(process.env)
                .filter(([_, value]) => value !== undefined)
                .reduce((acc, [key, value]) => {
                    acc[key] = value as string; // We know value is not undefined here
                    return acc;
                }, { ...userEnv }), // Start with userEnv, potentially overwriting process.env vars
            stderr: "overlapped" // Or pipe/inherit for debugging
        });

        console.log("Transport object created."); // Simplified log

        const client = new Client({
            name: `${info.id}-client`, // Use unique ID for client name
            version: info.manifest.version, // Use version from manifest
        });

        // Define the connection logic as an async IIFE
        const connectionPromise = (async () => {
            try {
                // Establish connection
                await client.connect(transport);
                console.log(`Successfully connected transport for ${info.manifest.displayName} (${extensionId})`);

                // Load tools
                const tools = await loadMcpTools(info.id, client, {
                    throwOnLoadError: true,
                });
                console.log(`Loaded ${tools.length} tools for ${info.manifest.displayName} (${extensionId})`);

                // Update the entry in the map with the fully loaded details *on success*
                const activeExtension: ActiveMCPExtension = {
                    info,
                    client,
                    transport,
                    tools,
                    connectionPromise: Promise.resolve(), // Mark promise as resolved successfully *within the entry*
                };
                this.activeConnections.set(extensionId, activeExtension);

                console.log(`MCP Extension '${extensionId}' fully connected and tools loaded.`);
                // TODO: IPC - Notify renderer of successful connection and available tools

            } catch (err: any) {
                console.error(`Error connecting to or loading tools for ${info.manifest.displayName} (${extensionId}): ${err.message}`);
                // Clean up: Remove the entry from the map on failure
                this.activeConnections.delete(extensionId);
                // Attempt to close the client if connect failed mid-way
                await client.close().catch(e => console.error(`Error closing client after connection failure for ${extensionId}: ${e.message}`));
                // TODO: IPC - Notify renderer of connection failure
                // Rethrow the error so the caller knows it failed
                throw new MCPExtensionError(`Failed to connect to MCP extension '${extensionId}': ${err.message}`);
            }
        })();

        // Store the initial entry immediately, including the *pending* promise
        // The async function above will either update this entry on success or delete it on failure.
        this.activeConnections.set(extensionId, {
            info,
            client,
            transport,
            tools: [], // Tools not loaded yet
            connectionPromise, // Store the pending promise itself
        });

        // Await the connection promise here. If it throws, the catch block above handles cleanup.
        // If it succeeds, the activeConnections entry will be updated by the async function.
        await connectionPromise;
    }

    /**
     * Disconnects from a specific MCP extension server.
     * @param extensionId The ID of the extension to disconnect from.
     */
    async disconnectMCP(extensionId: string): Promise<void> {
        const activeConnection = this.activeConnections.get(extensionId);
        if (!activeConnection) {
            console.log(`Extension '${extensionId}' is not currently connected or connection attempt failed.`);
            return;
        }

        console.log(`Disconnecting from MCP extension: ${activeConnection.info.manifest.displayName} (${extensionId})`);
        // Remove from map immediately to prevent further actions
        this.activeConnections.delete(extensionId);
         // TODO: IPC - Notify renderer of disconnection *start*

        try {
            // Wait for any ongoing connection attempt to finish before trying to close
            // Use a timeout in case the promise never resolves?
            await Promise.race([
                activeConnection.connectionPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection promise timeout')), 5000)) // 5s timeout
            ]).catch(err => {
                // Ignore errors from the connection promise itself (like connection failed error),
                // we still want to try closing the client. Log other errors (like timeout).
                if (!err.message?.includes('Failed to connect')) { // Avoid logging the expected connection failure again
                     console.warn(`Error or timeout waiting for connection promise during disconnect for ${extensionId}: ${err.message}`);
                }
            });


            // Now attempt to close the client
             console.log(`Attempting to close client for ${extensionId}`);
             await activeConnection.client.close();
            console.log(`Successfully closed client for ${activeConnection.info.manifest.displayName} (${extensionId})`);
        } catch (err: any) {
            console.error(`Error during disconnect/close client for ${extensionId}: ${err.message}`);
            // The connection is already removed from the map.
        } finally {
            // Transport listeners should be removed automatically on client.close() / transport close event
             console.log(`Finished disconnect process for ${extensionId}.`);
             // TODO: IPC - Notify renderer of disconnection *complete*
        }
    }

    /**
     * Disconnects all active MCP connections.
     */
    async disconnectAll(): Promise<void> {
        console.log("Disconnecting all active MCP extensions...");
        const extensionIds = Array.from(this.activeConnections.keys());
        const disconnectPromises = extensionIds.map(id => this.disconnectMCP(id));
        await Promise.allSettled(disconnectPromises); // Wait for all disconnections, logging individual errors if they occur
        console.log("Finished disconnecting all MCP extensions.");
    }

    /**
     * Gets the MCP client instance for a connected extension.
     * Returns undefined if the extension is not connected or connection failed.
     * @param extensionId The ID of the extension.
     * @returns The Client instance or undefined.
     */
    getConnectedClient(extensionId: string): Client | undefined {
         const conn = this.activeConnections.get(extensionId);
         // Check if connection promise has resolved successfully (tools are loaded)
         // This implicitly checks if conn exists.
         // Check conn first, then check tools length
         if (conn && conn.tools.length > 0) {
            return conn.client;
         }
        return undefined;
    }

     /**
     * Checks if an extension is currently fully connected (connection succeeded and tools loaded).
     * @param extensionId The ID of the extension.
     * @returns True if fully connected, false otherwise.
     */
    isConnected(extensionId: string): boolean {
        const conn = this.activeConnections.get(extensionId);
        // Considered connected only if the connection succeeded and tools are loaded
        return !!conn && conn.tools.length > 0;
    }

    /**
     * Gets the loaded tools for a specific connected extension.
     * Returns empty array if not connected or tools haven't loaded yet.
     * @param extensionId The ID of the extension.
     * @returns An array of tools.
     */
    getActiveTools(extensionId: string): StructuredToolInterface[] {
        return this.activeConnections.get(extensionId)?.tools ?? [];
    }

    /**
     * Gets all tools from all currently fully connected extensions.
     * @returns A flattened array of all active tools.
     */
    getAllActiveTools(): StructuredToolInterface[] {
        let allTools: StructuredToolInterface[] = [];
        for (const [extensionId, connection] of this.activeConnections.entries()) {
            // Only include tools if the connection is fully established (tools array is populated)
            if (connection.tools.length > 0) {
                 allTools = allTools.concat(connection.tools.map(tool => ({
                    ...tool,
                    name: `ext__${extensionId}__${tool.name}`,
                    description: tool.description,
                    extensionId: extensionId, // Already the key, but explicit for clarity
                    isRemote: false
                 })));
            }
        }
        return allTools;
    }

     /**
     * Gets the info for a specific active connection.
     * @param extensionId The ID of the extension.
     * @returns The MCPExtensionInfo for the active connection or undefined.
     */
    getActiveConnectionInfo(extensionId: string): MCPExtensionInfo | undefined {
        return this.activeConnections.get(extensionId)?.info;
    }

      /**
     * Gets the info for all active connections (including those potentially still connecting).
     * @returns A map of extension IDs to their info for active connections.
     */
    getAllActiveConnectionInfo(): Map<string, MCPExtensionInfo> {
        const activeInfoMap = new Map<string, MCPExtensionInfo>();
        for (const [id, connection] of this.activeConnections.entries()) {
            activeInfoMap.set(id, connection.info);
        }
        return activeInfoMap;
    }

     /**
     * Gets the info for all *fully* connected extensions (connection succeeded).
     * Useful for displaying connected status in UI.
     * @returns A map of extension IDs to their info for fully connected extensions.
     */
    getSuccessfullyConnectedInfo(): Map<string, MCPExtensionInfo> {
         const connectedInfoMap = new Map<string, MCPExtensionInfo>();
         for (const [id, connection] of this.activeConnections.entries()) {
             if (connection.tools.length > 0) { // Check if tools loaded (indicates success)
                 connectedInfoMap.set(id, connection.info);
             }
         }
         return connectedInfoMap;
     }

    /**
     * Attempts to connect to all managed extensions that are currently marked as enabled.
     * Logs errors for individual connection failures but continues with others.
     */
    public async connectAllEnabledExtensions(): Promise<void> {
        console.log("[ExtensionManager] Attempting to connect to all enabled extensions on startup...");
        const statuses = this.getManagedExtensionsStatus(); // Get current statuses
        let connectionAttempts = 0;

        for (const [extensionId, status] of statuses.entries()) {
            if (status.enabled) {
                connectionAttempts++;
                console.log(`[ExtensionManager] Auto-connecting enabled extension: ${extensionId}`);
                try {
                    // No need to await here if we want startup to be faster,
                    // but awaiting ensures logs appear in a more predictable order
                    // and errors are caught per-extension.
                    await this.connectWithMCP(extensionId); 
                } catch (error: any) {
                    // connectWithMCP should handle its own internal errors and logging
                    // but we catch here just in case to prevent stopping the loop.
                    console.error(`[ExtensionManager] Error auto-connecting extension ${extensionId}: ${error.message}`);
                }
            }
        }

        if (connectionAttempts === 0) {
            console.log("[ExtensionManager] No enabled extensions found to auto-connect.");
        } else {
            console.log(`[ExtensionManager] Finished attempting to auto-connect ${connectionAttempts} enabled extensions.`);
            // Note: Actual connection success is asynchronous and managed within connectWithMCP.
            // The initial 'tools-updated' event should be sent *after* this loop finishes in index.ts.
        }
    }

    /**
     * Finds and executes a tool by its exact name across all active connections.
     * @param toolName The exact name of the tool to execute.
     * @param toolParams The parameters to pass to the tool.
     * @returns The result of the tool execution.
     * @throws {MCPExtensionError} If the tool is not found in any active/connected extension or if execution fails.
     */
    async callExtensionTool(extensionId: string, originalToolName: string, toolArguments: any): Promise<any> {
        console.log(`Attempting to call tool '${originalToolName}' for extension '${extensionId}'`);
        const connection = this.activeConnections.get(extensionId);

        if (!connection) {
            console.error(`Extension '${extensionId}' not found or not active.`);
            throw new MCPExtensionError(`Extension not active: ${extensionId}`);
        }

        // Ensure the connection is fully established (tools loaded)
        if (!connection.tools || connection.tools.length === 0) {
            // This check might be too strict if the client doesn't need the tool list locally
            // and can call any tool by name. However, it's a good indicator of a ready connection.
            console.error(`Extension '${extensionId}' is not fully connected or has no tools loaded.`);
            throw new MCPExtensionError(`Extension not ready: ${extensionId}`);
        }

        // Optional: Verify the tool actually exists in the extension's manifest/loaded tools locally.
        // const foundTool = connection.tools.find(tool => tool.name === originalToolName);
        // if (!foundTool) {
        //     console.error(`Tool '${originalToolName}' not listed in loaded tools for extension '${extensionId}'.`);
        //     throw new MCPExtensionError(`Tool '${originalToolName}' not declared by extension '${extensionId}'.`);
        // }

        console.log(`Executing tool '${originalToolName}' in extension '${extensionId}'...`);
        try {
            const result = await connection.client.callTool({
                name: originalToolName, // Pass the original, unprefixed tool name
                arguments: toolArguments
            });
            console.log(`Tool '${originalToolName}' executed successfully by extension '${extensionId}'.`);
            return result;
        } catch (error: any) {
            console.error(`Error executing tool '${originalToolName}' in extension '${extensionId}': ${error.message}`);
            let errorMessage = `Execution failed for tool '${originalToolName}' in extension '${connection.info.manifest.displayName}'`;
            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
            } else {
                errorMessage += `: ${String(error)}`;
            }
            throw new MCPExtensionError(errorMessage);
        }
    }

} 