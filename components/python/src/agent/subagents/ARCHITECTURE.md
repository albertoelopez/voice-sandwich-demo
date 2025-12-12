# Subagent Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Voice Sandwich Demo                          │
│                     (FastAPI + WebSocket)                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Audio Stream
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STT Pipeline (AssemblyAI)                      │
│                  Audio → Text Transcription                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Transcript Events
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT LAYER                                 │
│                   (LangChain + LangGraph)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Supervisor Agent                           │    │
│  │         (Intent Classification & Routing)               │    │
│  │                                                          │    │
│  │  • Analyzes customer request                            │    │
│  │  • Determines intent (order/service/finish)             │    │
│  │  • Routes to appropriate specialist                     │    │
│  └───────────────────┬──────────────────────────────────────┘    │
│                      │                                           │
│         ┌────────────┴────────────┐                              │
│         │                         │                              │
│         ▼                         ▼                              │
│  ┌─────────────┐          ┌──────────────────┐                  │
│  │Order Agent  │          │Customer Service  │                  │
│  │             │          │     Agent        │                  │
│  │ TOOLS:      │          │                  │                  │
│  │ • add_to_   │          │ TOOLS:           │                  │
│  │   order     │          │ • get_menu_info  │                  │
│  │ • remove_   │          │ • get_ingredient │                  │
│  │   from_order│          │   _info          │                  │
│  │ • modify_   │          │ • get_store_info │                  │
│  │   order_item│          │ • handle_        │                  │
│  │ • confirm_  │          │   complaint      │                  │
│  │   order     │          │ • check_dietary_ │                  │
│  │ • get_order_│          │   options        │                  │
│  │   status    │          │                  │                  │
│  └─────────────┘          └──────────────────┘                  │
│         │                         │                              │
│         └────────────┬────────────┘                              │
│                      │                                           │
│                      │ Agent Response (streaming)                │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       │ Text Chunks
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TTS Pipeline (Cartesia)                       │
│                   Text → Audio Synthesis                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Audio Stream
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WebSocket                                 │
│                   Audio → Client Browser                         │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Example 1: Order Request

```
User: "I'd like a turkey sandwich"
  │
  ▼ STT
Transcript: "I'd like a turkey sandwich"
  │
  ▼ Supervisor Agent
Intent: ORDER
  │
  ▼ Route to Order Agent
Order Agent: "Great! I'll add a turkey sandwich to your order.
              What kind of bread would you like?"
  │ (calls add_to_order tool)
  ▼ TTS
Audio: [synthesized speech]
```

### Example 2: Customer Service Request

```
User: "What are your store hours?"
  │
  ▼ STT
Transcript: "What are your store hours?"
  │
  ▼ Supervisor Agent
Intent: CUSTOMER_SERVICE
  │
  ▼ Route to Customer Service Agent
CS Agent: "We're open Monday through Friday 7am to 9pm,
           and Saturday and Sunday 8am to 8pm."
  │ (calls get_store_info tool)
  ▼ TTS
Audio: [synthesized speech]
```

### Example 3: Mixed Conversation

```
User: "Do you have vegan options?"
  │
  ▼ Supervisor → Customer Service Agent
Response: "Yes! Our Veggie Delight sandwich is vegan-friendly..."
  │
  ▼
User: "Great, I'll take one of those"
  │
  ▼ Supervisor → Order Agent (context switch)
Response: "Added 1 x Veggie Delight to your order. What bread?"
```

## Component Interactions

### Thread ID Management

```
User Session ID: "abc-123"
  │
  ├─ Supervisor Thread: "abc-123_supervisor"
  │   └─ Used for routing decisions
  │
  ├─ Order Agent Thread: "abc-123_order"
  │   └─ Maintains order context
  │
  └─ Customer Service Thread: "abc-123_customer_service"
      └─ Maintains service context
```

### Message Flow Through Supervisor

```python
# 1. User message arrives
HumanMessage("I want a turkey sandwich")
  │
  ▼
# 2. Supervisor analyzes intent
supervisor.route(message, thread_id)
  │
  ▼
# 3. Returns agent type
AgentType: "order"
  │
  ▼
# 4. Process with selected agent
supervisor.process_with_agent(
    message="I want a turkey sandwich",
    agent_type="order",
    thread_id="abc-123"
)
  │
  ▼
# 5. Stream response
async for msg, metadata in stream:
    yield msg  # AIMessage, ToolMessage, etc.
```

## Event Stream Pipeline

```
Audio Bytes
  │
  ▼
┌─────────────┐
│ STT Stream  │ → stt_chunk events (partial transcripts)
│             │ → stt_output events (final transcripts)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Agent Stream │ → agent_chunk events (text tokens)
│  (Supervisor)│ → tool_call events (function calls)
│              │ → tool_result events (function results)
│              │ → agent_end events (turn completion)
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ TTS Stream  │ → tts_chunk events (audio bytes)
└──────┬──────┘
       │
       ▼
Audio Bytes (to client)
```

## Design Patterns

### 1. Supervisor Pattern

- **Purpose**: Route requests to specialized handlers
- **Benefits**:
  - Single point of entry
  - Scalable (easy to add new agents)
  - Maintains separate contexts per domain

### 2. Strategy Pattern

- **Purpose**: Each agent implements the same interface
- **Benefits**:
  - Interchangeable agents
  - Consistent API
  - Easy testing

### 3. Factory Pattern

- **Purpose**: `create_*_agent()` functions
- **Benefits**:
  - Encapsulates agent creation
  - Consistent configuration
  - Easy to extend

### 4. Async Iterator Pattern

- **Purpose**: Streaming responses
- **Benefits**:
  - Low latency
  - Progressive rendering
  - Memory efficient

## Extensibility

### Adding a New Agent

1. Create `new_agent.py`:
```python
def create_new_agent(model: str, checkpointer=None):
    return create_agent(
        model=model,
        tools=NEW_TOOLS,
        system_prompt=NEW_PROMPT,
        checkpointer=checkpointer,
    )
```

2. Update `supervisor.py`:
```python
class SupervisorAgent:
    def __init__(self, model, checkpointer):
        # ... existing agents ...
        self.new_agent = create_new_agent(model, checkpointer)

    async def route(self, message, thread_id):
        # ... add routing logic ...
        if "new_intent" in message:
            return "new_agent"
```

3. Update `__init__.py`:
```python
from agent.subagents.new_agent import create_new_agent

__all__ = [..., "create_new_agent"]
```

## Performance Characteristics

| Component | Latency | Throughput | Notes |
|-----------|---------|------------|-------|
| Supervisor Routing | +1 LLM call | ~100ms | One-time per turn |
| Order Agent | 1 LLM call | ~200-500ms | Depends on model |
| Customer Service | 1 LLM call | ~200-500ms | Depends on model |
| Tool Execution | N/A | <10ms | All tools are local |

## Memory Usage

- **Checkpointer**: Stores conversation history per thread
- **Thread Isolation**: Each agent maintains separate context
- **Garbage Collection**: Threads can be pruned based on age/size

## Error Handling

```
User Request
  │
  ▼
Try: Supervisor Route
  │
  ├─ Success → Process with agent
  │             │
  │             ├─ Success → Return response
  │             │
  │             └─ Failure → Log error, return friendly message
  │
  └─ Failure → Default to Order Agent (primary function)
```

## Testing Strategy

1. **Unit Tests**: Test individual agents and tools
2. **Integration Tests**: Test supervisor routing
3. **End-to-End Tests**: Test full pipeline with mock STT/TTS
4. **Load Tests**: Concurrent requests with different thread IDs

## Monitoring & Observability

Recommended metrics to track:

- **Routing Accuracy**: Percentage of correct agent selections
- **Response Time**: Per-agent latency distribution
- **Tool Usage**: Frequency of each tool invocation
- **Error Rate**: Failed requests per agent
- **Context Switches**: How often conversation switches agents
