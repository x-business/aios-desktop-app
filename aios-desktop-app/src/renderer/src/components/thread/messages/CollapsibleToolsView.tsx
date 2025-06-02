import { AIMessage, Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRemoteIntegrationsStore } from "@/stores/remoteIntegrationsStore";
import { PipedreamConnectButton } from "./PipedreamConnectButton";
import {
  getPipedreamConnectInfo,
  parseToolName,
  isComplexValue,
  findResultForToolCall,
  getFirstArgumentDisplayValue,
  getToolIconUrl
} from "../../../lib/tool-utils";

export function CollapsibleToolsView({
  toolCalls,
  messages,
}: {
  toolCalls: AIMessage["tool_calls"];
  messages: Message[];
}) {
  const [isOverallExpanded, setIsOverallExpanded] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const { configuredIntegrations } = useRemoteIntegrationsStore();

  if (!toolCalls || toolCalls.length === 0) return null;

  // Check for single Pipedream connect tool call scenario
  if (toolCalls.length === 1) {
    const firstToolCall = toolCalls[0];
    const resultMessageForFirstCall = firstToolCall.id ? findResultForToolCall(firstToolCall.id, messages) : undefined;
    const pipedreamConnectInfo = getPipedreamConnectInfo(resultMessageForFirstCall?.content);

    if (pipedreamConnectInfo) {
      // Render only the PipedreamConnectButton if it's a valid Pipedream connect link
      return (
        <div className="w-full max-w-4xl py-2">
          <PipedreamConnectButton url={pipedreamConnectInfo.url} appName={pipedreamConnectInfo.appName} />
        </div>
      );
    }
  }

  // Default rendering for multiple tool calls or non-Pipedream single tool calls
  const toggleResultExpansion = (id: string) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  let mainButtonPrimaryText = "Tool Activity";
  let firstArgDisplayValue: string | null = null;
  let singleToolCallInfo: ReturnType<typeof parseToolName> | null = null;
  let applyShimmerToCapsuleText = false;
  let mainIconUrl: string | null = null;

  // This logic is for the header of the collapsible view when it's not the special Pipedream case
  if (toolCalls.length === 1 && toolCalls[0].id) { // Re-check, but we know it's not Pipedream by now
    singleToolCallInfo = parseToolName(toolCalls[0].name);
    mainButtonPrimaryText = singleToolCallInfo.displayName;
    firstArgDisplayValue = getFirstArgumentDisplayValue(toolCalls[0].args as Record<string, any>);
    if (!findResultForToolCall(toolCalls[0].id, messages)) applyShimmerToCapsuleText = true;
    mainIconUrl = getToolIconUrl(singleToolCallInfo, configuredIntegrations);
  } else if (toolCalls.length > 1) {
    mainButtonPrimaryText = "Multiple Tools Invoked";
    if (toolCalls.some(tc => tc.id && !findResultForToolCall(tc.id, messages))) applyShimmerToCapsuleText = true;
  }

  return (
    <div className="w-full max-w-4xl rounded-lg">
      <div
        onClick={() => setIsOverallExpanded(!isOverallExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOverallExpanded(!isOverallExpanded); }}
        className="flex items-center w-full py-2 text-left transition-colors duration-150 ease-in-out rounded-t-lg focus:outline-none cursor-pointer"
      >
        <div className="inline-flex items-center">
          <div className={`inline-flex items-center rounded-full px-1 py-1 text-xs min-w-0 ${applyShimmerToCapsuleText ? 'shimmer-container-for-text' : ''}`}>
            {mainIconUrl ? (
              <img src={mainIconUrl} alt={mainButtonPrimaryText} className="w-5 h-5 mr-1.5 object-contain flex-shrink-0" />
            ) : (
              <Wrench size={16} className="mr-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}
            <span className={`font-medium text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ${applyShimmerToCapsuleText ? 'animate-shimmer' : ''}`}>
              {mainButtonPrimaryText}
            </span>
            {firstArgDisplayValue && (
              <span className={`ml-1.5 text-gray-500 dark:text-gray-400 truncate pl-1.5 border-l border-gray-300 dark:border-gray-500 ${applyShimmerToCapsuleText ? 'animate-shimmer' : ''}`}>
                {firstArgDisplayValue}
              </span>
            )}
          </div>
          <div className="ml-2">
            {isOverallExpanded ? (
              <ChevronUp size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOverallExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{ open: { opacity: 1, height: "auto" }, collapsed: { opacity: 0, height: 0 } }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-700/60"
          >
            <div className="px-2 py-2 space-y-3 bg-background dark:bg-gray-800/10 rounded-b-lg ">
              {toolCalls.map((tc, idx) => {
                const parsedNameInfo = parseToolName(tc.name);
                const resultMessage = tc.id ? findResultForToolCall(tc.id, messages) : undefined;
                const args = tc.args as Record<string, any>;
                const hasArgs = args && Object.keys(args).length > 0;
                const resultKey = tc.id || `result-${idx}`;
                const toolIconUrl = getToolIconUrl(parsedNameInfo, configuredIntegrations);

                // pipedreamConnectInfo is already checked at the top level for the special rendering path.
                // If we are here, it means this specific tool call is not the special Pipedream case OR it's part of multiple calls.
                const pipedreamConnectInfoForThisCall = getPipedreamConnectInfo(resultMessage?.content);
                
                let displayedResultContent = "";
                let shouldTruncateResult = false;
                const isResultExpanded = expandedResults[resultKey] ?? false;

                if (resultMessage && !pipedreamConnectInfoForThisCall) { // Use the specific check for this call
                    let resultString = "";
                    if (typeof resultMessage.content === 'string') {
                        resultString = resultMessage.content;
                    } else if (typeof resultMessage.content === 'object') {
                        resultString = JSON.stringify(resultMessage.content, null, 2);
                    } else {
                        resultString = String(resultMessage.content ?? "");
                    }
                    const resultLines = resultString.split("\n");
                    shouldTruncateResult = resultLines.length > 6 || resultString.length > 600;
                    displayedResultContent = (shouldTruncateResult && !isResultExpanded)
                      ? (resultString.length > 600 ? resultString.slice(0, 600) + "..." : resultLines.slice(0, 6).join("\n") + "\n...")
                      : resultString;
                }

                return (
                  <div key={tc.id || idx} className="p-2 space-y-2 border rounded-md shadow-sm bg-background dark:bg-gray-800">
                    <div className="p-2.5 rounded-md bg-muted/40 dark:bg-gray-700/30">
                      <div className="pb-1.5 mb-1.5 border-b border-gray-300 dark:border-gray-600">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                          {toolIconUrl ? (
                            <img src={toolIconUrl} alt={parsedNameInfo.displayName} className="w-4 h-4 mr-1.5 object-contain flex-shrink-0" />
                          ) : (
                            <Wrench size={16} className="mr-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          )}
                          {parsedNameInfo.displayName}
                          {parsedNameInfo.mcpName && (
                             <code className="px-1.5 py-0.5 ml-2 text-xs rounded-md bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 font-mono">
                               {parsedNameInfo.type === 'ext' ? 'Ext:' : 'Int:'} {parsedNameInfo.mcpName}
                             </code>
                          )}
                          {tc.id && (
                            <code className="px-1.5 py-0.5 ml-auto text-xs rounded-md bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 font-mono">
                              ID: {tc.id}
                            </code>
                          )}
                        </h4>
                      </div>
                      {hasArgs ? (
                        <table className="min-w-full text-sm">
                          <thead className="hidden"><tr><th>Arg</th><th>Val</th></tr></thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(args).map(([key, value], argIdx) => (
                              <tr key={argIdx} className={`${argIdx === 0 ? '' : 'pt-1 mt-1 border-gray-300 dark:border-gray-600'}`}>
                                <td className="pr-2 py-1.5 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap w-1/4 align-top">{key}:</td>
                                <td className="py-1.5 text-gray-700 dark:text-gray-200 w-3/4 align-top break-all">
                                  {isComplexValue(value) ? (
                                    <pre className="text-xs font-mono rounded bg-gray-100 dark:bg-gray-600/50 p-1.5 overflow-x-auto max-h-48 whitespace-pre-wrap">
                                      {JSON.stringify(value, null, 2)}
                                    </pre>
                                  ) : ( String(value) )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (<p className="px-1 py-2 text-xs text-gray-500 dark:text-gray-400">No arguments provided.</p>)}
                    </div>

                    {resultMessage && (
                       <div className="p-2.5 mt-1.5 border rounded-md shadow-sm bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/70">
                        <h5 className="pb-1.5 mb-1.5 font-semibold text-green-800 dark:text-green-200 border-b border-green-300 dark:border-green-600/80 flex items-center">
                          Tool Result
                          {resultMessage?.name && resultMessage.name !== tc.name && (
                             <code className="px-1.5 py-0.5 ml-2 text-xs rounded-md bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300">
                               Origin: {parseToolName(resultMessage.name).displayName}
                             </code>
                          )}
                        </h5>
                        {pipedreamConnectInfoForThisCall ? (
                          <div className="p-1.5">
                            <PipedreamConnectButton url={pipedreamConnectInfoForThisCall.url} appName={pipedreamConnectInfoForThisCall.appName} />
                          </div>
                        ) : (
                          resultMessage && (
                            <pre className="p-1.5 text-sm rounded bg-green-100/30 dark:bg-green-800/30 max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all text-green-700 dark:text-green-100">
                              {displayedResultContent}
                            </pre>
                          )
                        )}
                        {shouldTruncateResult && !pipedreamConnectInfoForThisCall && resultMessage && (
                           <button onClick={() => toggleResultExpansion(resultKey)} className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                             {isResultExpanded ? "Show less" : "Show more"}
                           </button>
                        )}
                      </div>
                    )}
                    {!resultMessage && isOverallExpanded && (
                        <div className="flex items-center px-2.5 py-2 mt-1.5 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-800/30 border border-yellow-300 dark:border-yellow-700/70 rounded-md">
                          <AlertCircle size={14} className="mr-1.5 flex-shrink-0" />
                          Awaiting result or result not available.
                        </div>
                    )}
                    {idx < toolCalls.length - 1 && <hr className="my-3 border-gray-300 dark:border-gray-600/50" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 