import type { StructuredToolInterface } from '@langchain/core/tools';
import type { RemoteIntegrationManager } from './remote-integration-manager.js';
import type { ExtensionManager } from './extension-manager.js';

export class ToolService {
    private extensionManager: ExtensionManager;
    private remoteIntegrationManager: RemoteIntegrationManager;

    constructor(extensionManager: ExtensionManager, remoteIntegrationManager: RemoteIntegrationManager) {
        this.extensionManager = extensionManager;
        this.remoteIntegrationManager = remoteIntegrationManager;
    }

    getAllActiveTools(): StructuredToolInterface[] {
        const localTools = this.extensionManager.getAllActiveTools();
        const remoteTools = this.remoteIntegrationManager.getAllActiveIntegrationTools();
        return [...localTools, ...remoteTools];
    }

    async invokeTool(invokedToolName: string, params: any): Promise<any> {
        if (invokedToolName.startsWith('int')) {
            const parts = invokedToolName.split('__');
            if (parts.length < 3) {
                throw new Error(`Invalid remote integration tool name format: ${invokedToolName}`);
            }
            // parts[0] is 'integration'
            const nameSlug = parts[1];
            const originalToolName = parts.slice(2).join('__'); // Handles tool names with __ in them

            const remoteIntegrationConfig = this.remoteIntegrationManager.getConfiguredIntegration(nameSlug);
            if (!remoteIntegrationConfig) {
                throw new Error(`Remote integration config not found for: ${nameSlug}`);
            }

            const activeConnection = (this.remoteIntegrationManager as any)['activeConnections'].get(nameSlug);
            if (activeConnection?.client) {
                return activeConnection.client.callTool({ name: originalToolName, arguments: params });
            } else {
                throw new Error(`Remote integration '${nameSlug}' is not connected or has no client.`);
            }
        } else if (invokedToolName.startsWith('ext')) {
            const parts = invokedToolName.split('__');
            if (parts.length < 3) {
                throw new Error(`Invalid local extension tool name format: ${invokedToolName}`);
            }
            // parts[0] is 'extension'
            const extensionId = parts[1];
            const originalToolName = parts.slice(2).join('__'); // Handles tool names with __ in them

            // Assuming ExtensionManager has a method like callExtensionTool
            // that takes extensionId and an object with name & arguments
            try {
                return await this.extensionManager.callExtensionTool(extensionId, originalToolName, params);
            } catch (error: any) {
                throw new Error(`Error calling local extension tool '${originalToolName}' for extension '${extensionId}': ${error.message}`);
            }
        } else {
            // Fallback or error for unrecognized tool name format
            // For now, we can attempt to call based on toolExtensionId if provided (legacy or direct call)
            // This part can be removed if prefixes are strictly enforced for all tools passed to ToolService
            console.warn(`Tool name '${invokedToolName}' does not follow known prefix conventions. Routing will not be performed by ToolService.`);
            throw new Error(`Tool name '${invokedToolName}' does not have a recognized prefix (integration__ or extension__).`);
        }
    }
} 