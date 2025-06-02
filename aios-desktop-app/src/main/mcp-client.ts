import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { StructuredToolInterface } from '@langchain/core/tools';
import fs from 'fs';
import path from 'path';
import { isDev } from './utils.js';

// --- Path Helper Functions --- 

function getBundledRuntimeExePath(exeRelativePath: string): string {
    return isDev() ? path.join(process.cwd(), exeRelativePath) : path.join(process.resourcesPath, exeRelativePath);
}

function getMcpServersBasePath(): string {
    return isDev() ? path.join(process.cwd(), 'mcp_servers') : path.join(process.resourcesPath, 'mcp_servers');
}

// --- Determine runtime paths --- 
const relativeNodeExePath = process.platform === 'win32' ? 'external_runtimes/node-win-x64/node.exe' : 'external_runtimes/node-linux-x64/node'; // TODO: Add linux path
const bundledNodeExePath = getBundledRuntimeExePath(relativeNodeExePath);

const relativePythonExePath = process.platform === 'win32' ? 'external_runtimes/python-win-x64/python.exe' : 'external_runtimes/python-linux-x64/python'; // TODO: Add linux path
const bundledPythonExePath = getBundledRuntimeExePath(relativePythonExePath);


/**
 * A class to handle MCP client operations by discovering and running bundled MCPs.
 */
export class MCPClientService { 
    private mcpClient: MultiServerMCPClient;
    private initialized: boolean = false;
    // configPath is no longer needed
    // private configPath: string;

    constructor() {
        // Discover and prepare server configurations dynamically
        const serverConfigs = this._discoverAndPrepareServers();
        
        console.log("[MCPClientService] Initializing MultiServerMCPClient with dynamically discovered servers:", JSON.stringify(serverConfigs, null, 2));
        
        this.mcpClient = new MultiServerMCPClient({
            throwOnLoadError: false, // Allow app to start even if some MCPs fail
            prefixToolNameWithServerName: true,
            additionalToolNamePrefix: 'mcp',
            mcpServers: serverConfigs // Pass the discovered and transformed configs
        });
    }

    // --- Discovery and Preparation Logic --- 
    private _discoverAndPrepareServers(): Record<string, any> {
        const servers: Record<string, any> = {};
        const mcpBasePath = getMcpServersBasePath();
        console.log(`[MCPClientService] Scanning for MCPs in: ${mcpBasePath}`);

        if (!fs.existsSync(mcpBasePath)) {
            console.error(`[MCPClientService] MCP base directory not found: ${mcpBasePath}`);
            return servers; // Return empty if base dir doesn't exist
        }

        try {
            const mcpFolders = fs.readdirSync(mcpBasePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            console.log(`[MCPClientService] Found potential MCP folders: ${mcpFolders.join(', ')}`);

            for (const folderName of mcpFolders) {
                const mcpFolderPath = path.join(mcpBasePath, folderName);
                const configPath = path.join(mcpFolderPath, 'config.json');
                let config: any;

                // 1. Read config.json
                if (!fs.existsSync(configPath)) {
                    console.warn(`[MCPClientService] Skipping folder '${folderName}': config.json not found.`);
                    continue;
                }
                try {
                    const configData = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(configData);
                } catch (err) {
                    console.error(`[MCPClientService] Skipping folder '${folderName}': Error reading/parsing config.json: ${err}`);
                    continue;
                }

                // 2. Validate required fields
                if (!config.name || typeof config.name !== 'string' || 
                    !config.command || typeof config.command !== 'string' || 
                    !config.args || !Array.isArray(config.args) || config.args.length < 1) {
                    console.error(`[MCPClientService] Skipping folder '${folderName}': Invalid or missing required fields (name, command, args[0]) in config.json.`);
                    continue;
                }
                const serverName = config.name;
                const originalCommand = config.command;
                const originalArgs = config.args;
                const relativeScriptPath = originalArgs[0]; // Expect script path as first arg

                let finalCommand: string | undefined;
                let absoluteScriptPath: string | undefined;
                let finalArgs: string[] = [];
                const cwdPath = mcpFolderPath; // CWD is the MCP's own folder

                // 3. Transform based on command
                if (originalCommand === 'node') {
                    finalCommand = bundledNodeExePath;
                    absoluteScriptPath = path.join(mcpFolderPath, relativeScriptPath);
                }
                else if (originalCommand === 'python') {
                   finalCommand = bundledPythonExePath;
                   // Assume relativeScriptPath in config.json points to the .pyz file
                   absoluteScriptPath = path.join(mcpFolderPath, relativeScriptPath);
                }
                else {
                    console.warn(`[MCPClientService] Skipping server '${serverName}': Unsupported command '${originalCommand}'. Only 'node' and 'python' are currently supported.`);
                    continue;
                }

                // 4. Verify script exists
                if (!absoluteScriptPath || !fs.existsSync(absoluteScriptPath)) {
                    console.error(`[MCPClientService] Skipping server '${serverName}': Script not found at resolved path: ${absoluteScriptPath}`);
                    continue;
                }

                // 5. Construct final args
                finalArgs = [absoluteScriptPath, ...originalArgs.slice(1)];

                // --- 6. Build final generic config object --- 
                const finalConfig: Record<string, any> = {
                    // Spread all original config fields EXCEPT the ones we are replacing
                    ...(({ name, command, args, cwd, ...rest }) => rest)(config),
                    // Add the transformed fields
                    command: finalCommand,
                    args: finalArgs,
                    cwd: cwdPath, 
                };
                
                servers[serverName] = finalConfig;
                console.log(`[MCPClientService] Prepared server '${serverName}'. Command: '${finalCommand}', CWD: '${cwdPath}'`);
            }
        } catch (err) {
            console.error(`[MCPClientService] Error reading MCP directory: ${err}`);
            // Decide if we should return partial servers or empty
        }

        return servers;
    }

    /**
     * Initialize connections to MCP servers
     */
    async initialize(): Promise<void> {
        if (!this.initialized) {
            try {
                console.log("[MCPClientService] Determined bundled node path:", bundledNodeExePath);
                console.log("[MCPClientService] Determined bundled python path:", bundledPythonExePath);
                console.log("[MCPClientService] Determined bundled mcp_servers path:", getMcpServersBasePath());
                console.log("[MCPClientService] Initializing MCP connections...");
                await this.mcpClient.initializeConnections();
                this.initialized = true;
                console.log("[MCPClientService] MCP connections initialized successfully.");
            } catch (error) {
                 console.error("[MCPClientService] Error during MCP connection initialization:", error);
                 // Optionally re-throw or handle the error further
                 throw error; // Re-throw to signal failure
            }
        }
    }

    /**
     * Get all available tools from the MCP client
     */
    async getTools(): Promise<StructuredToolInterface[]> {
        if (!this.initialized) {
            throw new Error('MCP client not initialized. Call initialize() first.');
        }
        return await this.mcpClient.getTools();
    }

    /**
     * Generic function to call a tool with given name and parameters
     * @param toolName The name of the tool to call
     * @param params Parameters required for the tool
     * @returns Promise with the tool execution result
     */
    async callTool<T = any>(toolName: string, params: Record<string, any>): Promise<T> {
        if (!this.initialized) {
            throw new Error('MCP client not initialized. Call initialize() first.');
        }
        
        // Get all available tools
        const tools = await this.mcpClient.getTools();
        
        // Find the specific tool by name
        const tool = tools.find(t => t.name === toolName);
        
        if (!tool) {
            throw new Error(`Tool "${toolName}" not found`);
        }
        
        try {
            // Call the tool with provided parameters
            const result = await tool.invoke(params);
            return result as T;
        } catch (error: any) {
            // Enhance error message with tool context
            throw new Error(`Error executing tool "${toolName}": ${error.message}`);
        }
    }

    /**
     * Close the MCP client connections
     */
    close(): void {
        if (this.initialized) {
            this.mcpClient.close();
            this.initialized = false;
        }
    }
}