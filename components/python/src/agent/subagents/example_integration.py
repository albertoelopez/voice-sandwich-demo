"""
Example Integration - How to use the subagent architecture with the existing voice pipeline.

This file demonstrates how to integrate the supervisor agent into the existing
main.py voice agent pipeline. It shows both simple (single agent) and advanced
(supervisor-based routing) usage patterns.
"""

from uuid import uuid4

from langchain.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

from agent.subagents import (
    create_customer_service_agent,
    create_order_agent,
    create_supervisor_agent,
)
from events import AgentChunkEvent, AgentEndEvent, ToolCallEvent, ToolResultEvent


# ============================================================================
# OPTION 1: Replace the single agent with the supervisor agent
# ============================================================================
# In main.py, replace lines 72-77 with:

# Using supervisor for automatic routing between order and customer service
agent = create_supervisor_agent(
    model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    checkpointer=InMemorySaver(),
)

# The agent can be used with the existing _agent_stream function without changes!
# The supervisor's astream() method is compatible with the existing interface.


# ============================================================================
# OPTION 2: Use individual specialized agents directly
# ============================================================================
# If you want to use a specific agent without routing:

# For order-taking only
order_agent = create_order_agent(
    model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    checkpointer=InMemorySaver(),
)

# For customer service only
customer_service_agent = create_customer_service_agent(
    model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    checkpointer=InMemorySaver(),
)


# ============================================================================
# OPTION 3: Custom integration with manual routing
# ============================================================================
async def custom_agent_stream_with_routing(event_stream):
    """
    Custom implementation showing manual routing logic.
    This is for advanced use cases where you want custom routing behavior.
    """
    thread_id = str(uuid4())
    supervisor = create_supervisor_agent(
        model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        checkpointer=InMemorySaver(),
    )

    async for event in event_stream:
        yield event

        if event.type == "stt_output":
            # Use the supervisor which automatically routes
            stream = supervisor.astream(
                {"messages": [HumanMessage(content=event.transcript)]},
                {"configurable": {"thread_id": thread_id}},
                stream_mode="messages",
            )

            async for message, metadata in stream:
                if isinstance(message, AIMessage):
                    yield AgentChunkEvent.create(message.text)
                    if hasattr(message, "tool_calls") and message.tool_calls:
                        for tool_call in message.tool_calls:
                            yield ToolCallEvent.create(
                                id=tool_call.get("id", str(uuid4())),
                                name=tool_call.get("name", "unknown"),
                                args=tool_call.get("args", {}),
                            )

                if isinstance(message, ToolMessage):
                    yield ToolResultEvent.create(
                        tool_call_id=getattr(message, "tool_call_id", ""),
                        name=getattr(message, "name", "unknown"),
                        result=str(message.content) if message.content else "",
                    )

            yield AgentEndEvent.create()


# ============================================================================
# Example: Testing the agents
# ============================================================================
async def test_agents():
    """
    Example test function showing how to interact with each agent type.
    """
    from langchain.messages import HumanMessage

    # Test order agent
    print("=== Testing Order Agent ===")
    order_agent = create_order_agent(
        model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        checkpointer=InMemorySaver(),
    )

    stream = order_agent.astream(
        {"messages": [HumanMessage(content="I'd like a turkey sandwich please")]},
        {"configurable": {"thread_id": "test-order"}},
        stream_mode="messages",
    )

    async for msg, metadata in stream:
        if isinstance(msg, AIMessage):
            print(f"Order Agent: {msg.text}")

    # Test customer service agent
    print("\n=== Testing Customer Service Agent ===")
    cs_agent = create_customer_service_agent(
        model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        checkpointer=InMemorySaver(),
    )

    stream = cs_agent.astream(
        {"messages": [HumanMessage(content="What are your store hours?")]},
        {"configurable": {"thread_id": "test-cs"}},
        stream_mode="messages",
    )

    async for msg, metadata in stream:
        if isinstance(msg, AIMessage):
            print(f"Customer Service: {msg.text}")

    # Test supervisor agent
    print("\n=== Testing Supervisor Agent ===")
    supervisor = create_supervisor_agent(
        model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        checkpointer=InMemorySaver(),
    )

    # Test with order request
    print("\nSupervisor handling order:")
    stream = supervisor.astream(
        {"messages": [HumanMessage(content="I want a roast beef sandwich")]},
        {"configurable": {"thread_id": "test-supervisor-1"}},
        stream_mode="messages",
    )

    async for msg, metadata in stream:
        if isinstance(msg, AIMessage):
            print(f"Supervisor: {msg.text}")

    # Test with customer service request
    print("\nSupervisor handling customer service:")
    stream = supervisor.astream(
        {"messages": [HumanMessage(content="Do you have vegan options?")]},
        {"configurable": {"thread_id": "test-supervisor-2"}},
        stream_mode="messages",
    )

    async for msg, metadata in stream:
        if isinstance(msg, AIMessage):
            print(f"Supervisor: {msg.text}")


# To run the tests:
# import asyncio
# asyncio.run(test_agents())
