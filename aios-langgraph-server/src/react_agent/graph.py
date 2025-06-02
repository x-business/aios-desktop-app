"""Define a custom Reasoning and Action agent.

Works with a chat model with tool calling support.
"""
import logging
from typing import Dict, List, Literal, cast, Any, Callable, Awaitable, Optional 


from langchain_core.messages import AIMessage, ToolMessage # Added ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph
# ToolNode is not used directly anymore
# from langgraph.prebuilt import ToolNode

from react_agent.configuration import Configuration
from react_agent.state import InputState, State
# TOOLS definition might not be needed here if tools come solely from config
# from react_agent.tools import TOOLS
# We need the manager getter to instantiate the executor
from react_agent.web.connection import get_connection_manager
# Import the executor and its exceptions
from react_agent.executors import (
    WebSocketToolExecutor,
    ToolTimeoutError,
    ClientUnavailableError,
    ToolExecutionError
)
from react_agent.utils import load_chat_model, normalize_message_for_openai

from react_agent.prompts import SYSTEM_PROMPT

# Initialize logger for this module
logger = logging.getLogger('graph')


async def _invoke_llm_with_retry_and_fallback(
    primary_model_invoke_func: Callable[[List[Any], Any], Awaitable[Any]],
    fallback_model_invoke_func: Optional[Callable[[List[Any], Any], Awaitable[Any]]],
    primary_model_identifier: str,
    fallback_model_identifier: Optional[str],
    messages_arg: List[Any],
    config_arg: Any,
) -> Any:
    """
    Invokes an LLM: attempts primary model once.
    If the primary model fails for ANY reason, it attempts the fallback model once (if provided).
    If both fail, the exception from the fallback attempt (or primary, if no fallback) is raised.
    The max_retries and base_delay_seconds parameters are currently not used in this logic.
    """
    primary_exception: Optional[Exception] = None
    logger.info(f"Attempting to invoke primary model: '{primary_model_identifier}'")
    try:
        return await primary_model_invoke_func(messages_arg, config_arg)
    except Exception as e_primary:
        primary_exception = e_primary
        logger.warning(f"Primary model '{primary_model_identifier}' failed with error: {e_primary}. Attempting fallback.")

    # If we reach here, primary model failed. Attempt fallback if available.
    if fallback_model_invoke_func and fallback_model_identifier:
        logger.info(f"Attempting to invoke fallback model: '{fallback_model_identifier}'")
        try:
            return await fallback_model_invoke_func(messages_arg, config_arg)
        except Exception as e_fallback:
            logger.error(f"Fallback model '{fallback_model_identifier}' also failed: {e_fallback}")
            if primary_exception: 
                raise e_fallback from primary_exception
    elif primary_exception:
        # Fallback not available or not attempted, but primary had an error.
        logger.error(f"Primary model '{primary_model_identifier}' failed, and no fallback was available or attempted successfully. Re-raising primary error.")
        raise primary_exception

# Define the function that calls the model
async def call_model(
    state: State, config: RunnableConfig
) -> Dict[str, List[AIMessage]]: # Return only messages
    """Call the LLM powering our "agent".

    Retrieves necessary configuration (tools, connection ID) from the RunnableConfig.
    This function prepares the prompt, initializes the model, and processes the response.

    Args:
        state (State): The current state of the conversation (primarily messages).
        config (RunnableConfig): Configuration for the model run. This function will
                                 ensure 'recursion_limit' is set on this config based
                                 on the derived Configuration object.

    Returns:
        dict: A dictionary containing only the messages update for the state.
    """
    # --- Get run-specific config --- START
    configuration = Configuration.from_runnable_config(config)
    
    # Ensure the RunnableConfig used by LangGraph has the recursion_limit from our Configuration
    config["recursion_limit"] = configuration.recursion_limit

    websocket_connection_id = configuration.websocket_connection_id
    user_tools = configuration.tools or [] # Ensure tools is a list

    if not websocket_connection_id:
         logger.error("Missing websocket_connection_id in configuration for call_model.")
         error_message = AIMessage(content="Configuration error: Missing required WebSocket connection ID.")
         # Return the error message to be added to the state
         return {"messages": [error_message]}

    if not user_tools:
         logger.warning(f"No tools provided in config for connection {websocket_connection_id}")
    # --- Get run-specific config --- END
    primary_model_identifier = configuration.model
    # Initialize the model with tool binding.
    
    model = load_chat_model(primary_model_identifier)
    if user_tools: # Only bind tools if they exist
        model = model.bind_tools(user_tools)
    
    

    # Format the system prompt.
    system_message = SYSTEM_PROMPT + "\n\n" +configuration.system_prompt;

    # Normalize all messages to prevent OpenAI API errors
    # when both tool_calls and function_call attributes exist
    processed_state_messages = [normalize_message_for_openai(msg) for msg in state.messages]
    
    _messages = [{"role": "system", "content": system_message}, *processed_state_messages]
     
    logger.info(f"Invoking model for connection {websocket_connection_id}")
    
    fallback_model_instance = load_chat_model(configuration.fallback_model) 
    
    _fallback_invoke_func: Optional[Callable[[List[Any], Any], Awaitable[Any]]] = None
    effective_fallback_model_identifier: Optional[str] = None

    if fallback_model_instance:
        fallback_model_instance = fallback_model_instance.bind_tools(user_tools)
        _fallback_invoke_func = fallback_model_instance.ainvoke
        effective_fallback_model_identifier = configuration.fallback_model
    else:
        logger.warning(f"Fallback model '{configuration.fallback_model}' could not be loaded. Proceeding without fallback.")
        _fallback_invoke_func = None
        effective_fallback_model_identifier = None

    response = cast(
        AIMessage,
        await _invoke_llm_with_retry_and_fallback(
            primary_model_invoke_func=model.ainvoke,
            fallback_model_invoke_func=_fallback_invoke_func,
            primary_model_identifier=primary_model_identifier,
            fallback_model_identifier=effective_fallback_model_identifier,
            messages_arg=_messages,
            config_arg=config,
        ),
    )
    logger.info(f"Model response received for {websocket_connection_id}. Tool calls: {bool(response.tool_calls)}")

    # Return ONLY the messages update
    return {"messages": [response]}


async def remote_tools_node(state: State, config: RunnableConfig) -> Dict[str, List[ToolMessage]]:
    """Executes tools remotely using the WebSocketToolExecutor."""
    tool_results: List[ToolMessage] = []
    last_message = state.messages[-1]

    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        logger.info("No tool calls found in the last message.")
        return {"messages": []}

    # --- Get run-specific config --- START
    configuration = Configuration.from_runnable_config(config)
    connection_id = configuration.websocket_connection_id
    # --- Get run-specific config --- END

    if not connection_id:
         logger.error("Missing websocket_connection_id in config for tools_node.")
         for tool_call in last_message.tool_calls:
             error_content = f"Configuration error: Cannot execute tool '{tool_call['name']}' without a WebSocket connection ID."
             tool_results.append(ToolMessage(content=error_content, tool_call_id=tool_call['id']))
         return {"messages": tool_results}

    # Instantiate the executor
    manager = get_connection_manager()
    executor = WebSocketToolExecutor(connection_manager=manager)
    
    # Default timeout for tool execution (can be made configurable via config)
    tool_timeout = 30.0 # Consider getting this from configuration object too

    for tool_call in last_message.tool_calls:
        tool_call_id = tool_call['id']
        tool_name = tool_call['name']
        tool_args = tool_call['args']
        logger.info(f"Processing tool call {tool_call_id}: '{tool_name}' with args {tool_args} for connection {connection_id}")

        try:
            # Use the executor to call the tool remotely
            result = await executor.execute(
                connection_id=connection_id,
                tool_call_id=tool_call_id,
                tool_name=tool_name,
                tool_args=tool_args,
                timeout=tool_timeout
            )
            logger.info(f"Received result for tool call {tool_call_id}: {result}")
            content = result
            tool_results.append(ToolMessage(
                content=str(content),
                tool_call_id=tool_call_id
            ))
        except ToolTimeoutError as e:
            logger.error(f"Error executing tool call {tool_call_id}: {e}")
            tool_results.append(ToolMessage(content=f"Error: Tool '{tool_name}' timed out after {e.timeout} seconds.", tool_call_id=tool_call_id))
        except ClientUnavailableError as e:
            logger.error(f"Error executing tool call {tool_call_id}: {e}")
            tool_results.append(ToolMessage(content=f"Error: Client connection for tool '{tool_name}' is not available.", tool_call_id=tool_call_id))
        except ToolExecutionError as e:
            logger.error(f"Error executing tool call {tool_call_id}: {e}", exc_info=True)
            tool_results.append(ToolMessage(content=f"Error: Failed to execute tool '{tool_name}'. Reason: {e}", tool_call_id=tool_call_id))
        except Exception as e:
            logger.exception(f"Unexpected error processing tool call {tool_call_id} ('{tool_name}')", exc_info=True)
            tool_results.append(ToolMessage(content=f"Error: An unexpected error occurred while trying to execute tool '{tool_name}'.", tool_call_id=tool_call_id))

    # Return ONLY the messages update
    return {"messages": tool_results}

# Define a new graph
builder = StateGraph(State, input=InputState, config_schema=Configuration)

# Define the two nodes we will cycle between
builder.add_node("call_model", call_model) # Use the updated call_model
builder.add_node("tools", remote_tools_node) # Use the new remote_tools_node

# Set the entrypoint as `call_model`
# This means that this node is the first one called
builder.add_edge("__start__", "call_model")


def route_model_output(state: State) -> Literal["__end__", "tools"]:
    """Determine the next node based on the model's output.

    This function checks if the model's last message contains tool calls.

    Args:
        state (State): The current state of the conversation.

    Returns:
        str: The name of the next node to call ("__end__" or "tools").
    """
    last_message = state.messages[-1]
    if not isinstance(last_message, AIMessage):
         # This might happen if the last message was an error ToolMessage added by tools_node
         # Or if call_model returned an error message
         logger.warning(f"Routing model output, but last message is not AIMessage: {type(last_message).__name__}. Ending run.")
         return "__end__" # End the run if the last message isn't from the AI

    # If there is no tool call, then we finish
    if not last_message.tool_calls:
        logger.info("Model finished. Routing to __end__.")
        return "__end__"
    # Otherwise we execute the requested actions
    logger.info("Model requested tools. Routing to tools node.")
    return "tools"


# Add a conditional edge to determine the next step after `call_model`
builder.add_conditional_edges(
    "call_model",
    # After call_model finishes running, the next node(s) are scheduled
    # based on the output from route_model_output
    route_model_output,
)

# Add a normal edge from `tools` to `call_model`
# This creates a cycle: after using tools, we always return to the model
builder.add_edge("tools", "call_model")

# Compile the builder into an executable graph
# You can customize this by adding interrupt points for state updates
graph = builder.compile(
    interrupt_before=[],  # Add node names here to update state before they're called
    interrupt_after=[],  # Add node names here to update state after they're called
)
graph.config = RunnableConfig(recursion_limit=100)
graph.name = "AIOS Agent V2" # Updated name
