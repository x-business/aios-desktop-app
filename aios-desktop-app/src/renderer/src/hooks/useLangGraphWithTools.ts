import { useCallback, useMemo, useEffect, useState } from 'react';
import { useStreamContext } from "@/providers/Stream"; 
import { useWebSocket } from '../providers/WebSocketProvider';
import { useToolStore } from '../stores/toolStore'; // Import the tool store hook
import { useUserInfoStore, UserInfo } from '../stores/userInfoStore'; // Import the user info store and type
import { useSystemPromptStore } from '../stores/settingsStore'; // Import the system prompt store
import type { LangGraphRunConfig, SystemInfo } from '@shared/types/index.js'; // Import types
import { RunnableConfig } from '@langchain/core/runnables';
import { DEFAULT_RECURSION_LIMIT } from '@/config';


type LangGraphWithToolsResult = ReturnType<typeof useStreamContext> & {
  connectionReady: boolean;
  connectionStatus: string;
  // Note: activeTools themselves are available via useToolStore directly
};

/**
 * Create a formatted user context string from user information
 */
const formatUserContext = (userInfo: UserInfo) => {
  // Skip empty fields to keep the context concise
  const nonEmptyFields = Object.entries(userInfo)
    .filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value && value.trim() !== '';
      return !!value;
    });
  
  if (nonEmptyFields.length === 0) return '';

  // Format the user information into a readable string
  const userContextParts = nonEmptyFields.map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: ${value.join(', ')}`;
    }
    return `${key}: ${value}`;
  });

  return `USER INFORMATION:\n${userContextParts.join('\n')}`;
};

/**
 * Format system information into a readable string
 */
const formatSystemInfo = (sysInfo: SystemInfo): string => {
  if (!sysInfo) return '';
  
  const parts = [
    `OS: ${sysInfo.platform} ${sysInfo.release} (${sysInfo.arch})`,
    `Hostname: ${sysInfo.hostname}`,
  ];
  
  if (sysInfo.cpus && sysInfo.cpus.length > 0) {
    parts.push(`CPU: ${sysInfo.cpus[0].model} (${sysInfo.cpus.length} cores)`);
  }
  
  if (sysInfo.totalMemoryMB) {
    parts.push(`Memory: ${Math.round(sysInfo.totalMemoryMB / 1024)} GB`);
  }
  
  // Only include username if needed for path construction (not for privacy concerns)
  if (sysInfo.username) {
    parts.push(`User: ${sysInfo.username}`);
  }
  
  return `SYSTEM INFORMATION:\n${parts.join('\n')}`;
};

/**
 * Hook that wraps the existing StreamContext, enhancing its `submit` method
 * to automatically include the WebSocket connection ID and current active tools
 * in the run configuration.
 */
export const useLangGraphWithTools = (): LangGraphWithToolsResult => {
  const { connectionId, status } = useWebSocket();
  // Get the active tools from the Zustand store
  const activeTools = useToolStore(state => state.activeTools);
  // Get the user information from the Zustand store
  const userInfo = useUserInfoStore(state => state.userInfo);
  // Get the custom system prompt from the store
  const { systemPrompt: customSystemPrompt } = useSystemPromptStore();
  
  // State to store system information
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  
  // Get the stream context provided by StreamProvider
  const stream = useStreamContext();
  
  // Fetch system information on component mount
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await window.api.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error('Failed to fetch system information:', error);
      }
    };
    
    fetchSystemInfo();
  }, []);
  
  /**
   * Enhanced submit function that includes WebSocket connection information
   * and active tools in the config.configurable object.
   */
  const submitWithTools = useCallback(
    async (input: any, submitOptions?: any) => {
      // Check if the WebSocket connection is ready
      if (status !== 'registered' || !connectionId) {
        console.error('WebSocket connection not ready for tool execution. Status:', status, 'ID:', connectionId);
        throw new Error('WebSocket connection not established. Cannot execute tools.');
      }
      
      // Format user context if information is available
      const userContext = formatUserContext(userInfo);
      
      // Format system information if available
      const sysInfoContext = systemInfo ? formatSystemInfo(systemInfo) : '';
      
      // Current system time formatted as a string
      const currentTimeInfo = "Current system time where you are operating is " + new Date().toLocaleString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', 
        minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' 
      });
      
      // Create system prompt combining custom prompt (if provided), user context, and current time
      const systemPromptParts: string[] = [];
      
      // Only add the custom system prompt if it's not empty
      if (customSystemPrompt && customSystemPrompt.trim()) {
        systemPromptParts.push(customSystemPrompt);
      }
      
      // Add user context, system info, and current time
      if (userContext) {
        systemPromptParts.push(userContext);
      }
      if (sysInfoContext) {
        systemPromptParts.push(sysInfoContext);
      }
      systemPromptParts.push(currentTimeInfo);
      
      const systemPrompt = systemPromptParts.join('\n\n');
      
      // Prepare the config object, now including tools from the store and user context
      const config: RunnableConfig = {
        ...(submitOptions?.config || {}),
        recursionLimit: DEFAULT_RECURSION_LIMIT,
        configurable: {
          ...(submitOptions?.config?.configurable || {}),
          websocket_connection_id: connectionId,
          tools: activeTools,
          system_prompt: systemPrompt,
        } as LangGraphRunConfig, // Ensure type safety
      };
      
      // Create updated options including the enhanced config
      const updatedOptions = {
        ...submitOptions,
        config,
      };
      
      // Call the original stream.submit with the input and updated options
      return stream.submit(input, updatedOptions);
    },
    // Dependencies: original stream object, WebSocket details, active tools, user info, custom system prompt, system info
    [stream, connectionId, status, activeTools, userInfo, customSystemPrompt, systemInfo]
  );
  
  // Return an object that spreads the original stream context properties,
  // overrides `submit` with our enhanced version, and adds connection status.
  return useMemo(
    () => ({
      ...stream,
      submit: submitWithTools,
      connectionReady: status === 'registered' && !!connectionId,
      connectionStatus: status,
    }),
    // Dependencies: original stream object, enhanced submit function, WebSocket status/ID
    [stream, submitWithTools, status, connectionId]
  );
};

export default useLangGraphWithTools; 