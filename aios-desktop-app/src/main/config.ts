import dotenv from 'dotenv';
import path from 'path';
// Keep import { fileURLToPath } from 'url'; // <-- Keep this if needed elsewhere, otherwise remove


// Load .env file from the project root (relative to source file location)
// Use the automatically provided __dirname if available
const envPath = path.resolve(__dirname, '../../.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
    // Use console.warn for non-critical errors
    console.warn(`Warning: Could not load .env file from ${envPath}. Using defaults or environment variables. Error: ${result.error.message}`);
}

interface Config {
    langGraphApiUrl: string;
    webSocketUrl: string;
    authApiUrl: string;
    mcpExtensionRegistryUrl: string;
}

// const devConfig = {
//     langGraphApiUrl: 'http://127.0.0.1:2024',
//     webSocketUrl: 'ws://127.0.0.1:2024/ws',
//     authApiUrl: 'http://127.0.0.1:8000',
//     mcpExtensionRegistryUrl: 'https://raw.githubusercontent.com/mibrahim2001/mcp-extensions/main/registery.json',
// }

const stageConfig = {
    langGraphApiUrl: 'http://34.51.146.169:2024',
    webSocketUrl: 'ws://34.51.146.169:2024/ws',
    authApiUrl: 'http://34.51.146.169:8000',
    mcpExtensionRegistryUrl: 'https://raw.githubusercontent.com/mibrahim2001/mcp-extensions/main/registery.json',
}

// Use stageConfig if NODE_ENV is set to 'staging', otherwise use devConfig
const config: Config = stageConfig;

// Basic URL validation (optional but recommended)
function isValidUrl(url: string, expectedProtocol: 'http' | 'ws'): boolean {
    try {
        const parsed = new URL(url);
        // Allow https and wss as well
        return parsed.protocol === `${expectedProtocol}:` || parsed.protocol === `${expectedProtocol}s:`; 
    } catch (e) {
        return false;
    }
}

if (!isValidUrl(config.langGraphApiUrl, 'http')) {
    console.error(`Configuration Error: Invalid LANGGRAPH_API_URL: ${config.langGraphApiUrl}. Must start with http:// or https://`);
    // Decide if you want to exit or proceed with potentially invalid config
    // process.exit(1); 
}
if (!isValidUrl(config.webSocketUrl, 'ws')) {
    console.error(`Configuration Error: Invalid WEBSOCKET_URL: ${config.webSocketUrl}. Must start with ws:// or wss://`);
    // process.exit(1);
}

console.log('Configuration loaded:');
console.log(` - LangGraph API URL: ${config.langGraphApiUrl}`);
console.log(` - WebSocket URL: ${config.webSocketUrl}`);
console.log(` - Auth API URL: ${config.authApiUrl}`);
console.log(` - MCP Extension Registry URL: ${config.mcpExtensionRegistryUrl}`);

// Use .js extension for default export if needed by module system
export default config; 