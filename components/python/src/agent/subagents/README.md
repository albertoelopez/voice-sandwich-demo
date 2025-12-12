# Subagent Architecture

A specialized multi-agent system for the voice sandwich ordering application, featuring intelligent routing between domain-specific agents.

## Overview

This package implements a **supervisor pattern** with specialized subagents that handle different aspects of customer interaction:

- **Order Agent**: Handles order taking, modifications, and confirmations
- **Customer Service Agent**: Manages questions, complaints, and information requests
- **Supervisor Agent**: Intelligently routes requests to the appropriate specialized agent

## Architecture

```
Customer Input
      |
      v
┌──────────────┐
│  Supervisor  │ ← Routes based on intent
└──────┬───────┘
       |
       ├─────────────┐
       v             v
┌──────────┐  ┌─────────────────┐
│  Order   │  │ Customer Service│
│  Agent   │  │     Agent       │
└──────────┘  └─────────────────┘
```

## Features

- **Intelligent Routing**: Supervisor analyzes customer intent and routes to the appropriate agent
- **Specialized Tools**: Each agent has domain-specific tools optimized for its role
- **Context Preservation**: Maintains conversation history across agent switches
- **Async Compatible**: Fully compatible with the existing async voice pipeline
- **Drop-in Replacement**: Can replace the single agent in main.py without code changes

## Quick Start

### Option 1: Using the Supervisor (Recommended)

Replace the agent creation in `main.py` with:

```python
from agent.subagents import create_supervisor_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_supervisor_agent(
    model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    checkpointer=InMemorySaver(),
)
```

That's it! The supervisor will automatically route requests between order taking and customer service.

### Option 2: Using Individual Agents

For specialized use cases, use agents directly:

```python
from agent.subagents import create_order_agent, create_customer_service_agent

# Order-only agent
order_agent = create_order_agent(
    model="ollama:llama3",
    checkpointer=InMemorySaver(),
)

# Customer service-only agent
cs_agent = create_customer_service_agent(
    model="ollama:llama3",
    checkpointer=InMemorySaver(),
)
```

## Agent Capabilities

### Order Agent

**Purpose**: Handle all order-related tasks efficiently

**Tools**:
- `add_to_order(item, quantity)` - Add items to the order
- `remove_from_order(item, quantity)` - Remove items from the order
- `modify_order_item(item, modification)` - Modify existing order items
- `confirm_order(order_summary)` - Finalize and send order to kitchen
- `get_order_status()` - Check order status

**Example Requests**:
- "I'd like a turkey sandwich with swiss cheese"
- "Add chips to my order"
- "Change that to cheddar cheese instead"
- "Remove the pickles"
- "Confirm my order"

### Customer Service Agent

**Purpose**: Handle inquiries, complaints, and provide information

**Tools**:
- `get_menu_info(category)` - Get menu details (sandwiches, sides, drinks)
- `get_ingredient_info(item)` - Get ingredient and allergen information
- `get_store_info(info_type)` - Get store hours, location, contact
- `handle_complaint(issue)` - Process customer complaints empathetically
- `check_dietary_options(restriction)` - Find options for dietary restrictions

**Example Requests**:
- "What are your store hours?"
- "Do you have vegan options?"
- "What's in the turkey sandwich?"
- "My sandwich was cold!"
- "Are there gluten-free options?"

### Supervisor Agent

**Purpose**: Route requests to the appropriate specialized agent

**Routing Logic**:
- Order-related requests → Order Agent
- Questions, complaints, information → Customer Service Agent
- Goodbye/completion → FINISH

**Intelligence**: The supervisor analyzes the semantic meaning of requests, not just keywords.

## Integration Examples

### Example 1: Drop-in Replacement

Simply replace the agent in `main.py`:

```python
# Before
agent = create_agent(
    model="ollama:llama3",
    tools=[add_to_order, confirm_order],
    system_prompt=system_prompt,
    checkpointer=InMemorySaver(),
)

# After
from agent.subagents import create_supervisor_agent

agent = create_supervisor_agent(
    model="ollama:llama3",
    checkpointer=InMemorySaver(),
)
```

No other changes needed! The supervisor's `astream()` method is compatible with the existing pipeline.

### Example 2: Manual Routing

For custom routing logic:

```python
from agent.subagents import SupervisorAgent

supervisor = SupervisorAgent(
    model="ollama:llama3",
    checkpointer=InMemorySaver(),
)

# Manually route a message
agent_type = await supervisor.route("I want a sandwich", thread_id="123")
# Returns: "order"

# Process with the selected agent
async for msg, metadata in supervisor.process_with_agent(
    message="I want a turkey sandwich",
    agent_type="order",
    thread_id="123"
):
    print(msg.text)
```

### Example 3: Testing Individual Agents

```python
from langchain.messages import HumanMessage
from agent.subagents import create_order_agent

agent = create_order_agent(
    model="ollama:llama3",
    checkpointer=InMemorySaver(),
)

stream = agent.astream(
    {"messages": [HumanMessage(content="I want a turkey sandwich")]},
    {"configurable": {"thread_id": "test-123"}},
    stream_mode="messages",
)

async for msg, metadata in stream:
    if isinstance(msg, AIMessage):
        print(msg.text)
```

## File Structure

```
subagents/
├── __init__.py                    # Package exports
├── order_agent.py                 # Order-taking specialist
├── customer_service_agent.py      # Customer service specialist
├── supervisor.py                  # Routing supervisor
├── example_integration.py         # Integration examples
└── README.md                      # This file
```

## Design Principles

1. **Single Responsibility**: Each agent has a clear, focused purpose
2. **Composability**: Agents can be used independently or together
3. **Compatibility**: Works seamlessly with existing async pipeline
4. **Extensibility**: Easy to add new specialized agents
5. **Type Safety**: Fully typed with proper type hints

## Advanced Usage

### Custom Agent

Create your own specialized agent:

```python
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

def my_custom_tool(param: str) -> str:
    return f"Processed: {param}"

CUSTOM_TOOLS = [my_custom_tool]

CUSTOM_PROMPT = """
You are a specialized agent for...
"""

def create_custom_agent(model: str, checkpointer=None):
    return create_agent(
        model=model,
        tools=CUSTOM_TOOLS,
        system_prompt=CUSTOM_PROMPT,
        checkpointer=checkpointer,
    )
```

### Multi-Agent Conversations

The supervisor maintains separate contexts for each agent:

```python
# Thread IDs are automatically managed:
# - Supervisor: {thread_id}_supervisor
# - Order Agent: {thread_id}_order
# - Customer Service: {thread_id}_customer_service

# This allows seamless context switching between agents
# while preserving conversation history for each domain.
```

### Custom Routing Logic

Extend the SupervisorAgent class:

```python
from agent.subagents.supervisor import SupervisorAgent

class CustomSupervisor(SupervisorAgent):
    async def route(self, message: str, thread_id: str):
        # Custom routing logic
        if "urgent" in message.lower():
            return "priority_agent"
        return await super().route(message, thread_id)
```

## Performance Considerations

- **Routing Overhead**: The supervisor adds one LLM call for routing. For performance-critical applications, consider using a single specialized agent.
- **Memory Usage**: Each agent maintains its own conversation context. Use appropriate checkpointer configurations.
- **Concurrency**: All agents support async streaming for low-latency responses.

## Testing

See `example_integration.py` for test functions:

```python
import asyncio
from agent.subagents.example_integration import test_agents

asyncio.run(test_agents())
```

## Future Enhancements

Potential additions to the architecture:

- **Analytics Agent**: Track orders and provide business insights
- **Reservation Agent**: Handle table reservations
- **Feedback Agent**: Collect and process customer feedback
- **Loyalty Agent**: Manage rewards and loyalty programs

## Troubleshooting

### Agent not routing correctly

Check the supervisor's routing logic and ensure your request is clear:

```python
# Instead of: "stuff"
# Use: "I'd like to place an order for a turkey sandwich"
```

### Context not preserved

Ensure you're using the same `thread_id` across requests:

```python
thread_id = str(uuid4())
# Use this same thread_id for all messages in the conversation
```

### Import errors

Make sure you're importing from the package:

```python
# Correct
from agent.subagents import create_supervisor_agent

# Incorrect
from subagents import create_supervisor_agent
```

## Contributing

To add a new specialized agent:

1. Create a new file: `{agent_name}_agent.py`
2. Define tools and system prompt
3. Create a `create_{agent_name}_agent()` factory function
4. Add to `__init__.py` exports
5. Update supervisor routing logic if needed

## License

Same as the parent project.
