"""
Supervisor Agent - Routes customer requests to specialized subagents.

This module implements a supervisor pattern that:
- Analyzes incoming customer requests
- Routes them to the appropriate specialized agent (order or customer service)
- Coordinates multi-turn conversations
- Maintains context across agent switches
"""

from typing import AsyncIterator, Literal

from langchain.agents import create_agent
from langchain.messages import AIMessage, HumanMessage, ToolMessage
from langchain_core.runnables import Runnable
from langgraph.checkpoint.memory import InMemorySaver

from agent.subagents.customer_service_agent import create_customer_service_agent
from agent.subagents.order_agent import create_order_agent


# Type definitions for agent routing
AgentType = Literal["order", "customer_service", "FINISH"]


def route_to_agent(next_agent: AgentType) -> str:
    """
    Tool used by supervisor to route requests to specialized agents.

    Args:
        next_agent: The agent to route to ("order", "customer_service", or "FINISH")

    Returns:
        Confirmation of routing decision
    """
    if next_agent == "FINISH":
        return "Conversation completed. Thank you!"
    return f"Routing to {next_agent} agent."


# Supervisor tools
SUPERVISOR_TOOLS = [route_to_agent]


SUPERVISOR_SYSTEM_PROMPT = """
You are a routing supervisor for a sandwich shop voice assistant. Your job is to \
analyze customer requests and route them to the appropriate specialized agent.

Available agents:
1. ORDER AGENT - Handles all order-related tasks:
   - Taking new orders
   - Adding/removing items
   - Modifying orders
   - Confirming orders
   - Order status checks

2. CUSTOMER_SERVICE AGENT - Handles questions and support:
   - Menu questions and information
   - Ingredient and allergen inquiries
   - Store information (hours, location)
   - Complaints and issues
   - Dietary restrictions

Routing guidelines:
- If the customer wants to place, modify, or check an order → route to ORDER agent
- If the customer has questions, complaints, or needs information → route to CUSTOMER_SERVICE agent
- If the conversation is complete or customer says goodbye → use FINISH
- When in doubt, prefer ORDER agent (primary function of the shop)

Examples:
- "I'd like a turkey sandwich" → ORDER
- "What are your hours?" → CUSTOMER_SERVICE
- "Do you have gluten-free options?" → CUSTOMER_SERVICE
- "Add chips to my order" → ORDER
- "My sandwich was cold" → CUSTOMER_SERVICE
- "Thanks, goodbye" → FINISH

Be decisive and route quickly. Don't engage in conversation yourself - just route.

${CARTESIA_TTS_SYSTEM_PROMPT}
"""


class SupervisorAgent:
    """
    Supervisor agent that coordinates between specialized subagents.

    This class manages the routing logic and maintains separate agent instances
    for different specializations, ensuring efficient task delegation.

    Attributes:
        supervisor: The main routing agent
        order_agent: Specialized agent for order taking
        customer_service_agent: Specialized agent for customer service
        model: The LLM model identifier
        checkpointer: Optional memory checkpointer
    """

    def __init__(
        self,
        model: str,
        checkpointer: InMemorySaver | None = None,
    ):
        """
        Initialize the supervisor agent with specialized subagents.

        Args:
            model: The LLM model identifier (e.g., "ollama:llama3")
            checkpointer: Optional checkpointer for conversation memory
        """
        self.model = model
        self.checkpointer = checkpointer or InMemorySaver()

        # Create the supervisor routing agent
        self.supervisor = create_agent(
            model=model,
            tools=SUPERVISOR_TOOLS,
            system_prompt=SUPERVISOR_SYSTEM_PROMPT,
            checkpointer=self.checkpointer,
        )

        # Create specialized subagents
        self.order_agent = create_order_agent(
            model=model,
            checkpointer=self.checkpointer,
        )

        self.customer_service_agent = create_customer_service_agent(
            model=model,
            checkpointer=self.checkpointer,
        )

    async def route(
        self,
        message: str,
        thread_id: str,
    ) -> AgentType:
        """
        Determine which agent should handle the message.

        Args:
            message: The customer's message
            thread_id: Conversation thread identifier

        Returns:
            The agent type to route to ("order", "customer_service", or "FINISH")
        """
        config = {"configurable": {"thread_id": f"{thread_id}_supervisor"}}

        # Ask supervisor to route
        stream = self.supervisor.astream(
            {"messages": [HumanMessage(content=message)]},
            config,
            stream_mode="messages",
        )

        # Extract routing decision from tool calls
        async for msg, metadata in stream:
            if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls"):
                for tool_call in msg.tool_calls:
                    if tool_call.get("name") == "route_to_agent":
                        return tool_call.get("args", {}).get("next_agent", "order")

        # Default to order agent if routing unclear
        return "order"

    async def process_with_agent(
        self,
        message: str,
        agent_type: AgentType,
        thread_id: str,
    ) -> AsyncIterator[tuple[AIMessage | ToolMessage, dict]]:
        """
        Process a message with a specific agent.

        Args:
            message: The customer's message
            agent_type: Which agent to use ("order" or "customer_service")
            thread_id: Conversation thread identifier

        Yields:
            Tuples of (message, metadata) from the agent's response stream
        """
        # Select the appropriate agent
        if agent_type == "order":
            agent = self.order_agent
        elif agent_type == "customer_service":
            agent = self.customer_service_agent
        else:
            # Should not happen, but handle gracefully
            return

        # Use a separate thread ID for each agent to maintain separate contexts
        config = {"configurable": {"thread_id": f"{thread_id}_{agent_type}"}}

        # Stream response from selected agent
        stream = agent.astream(
            {"messages": [HumanMessage(content=message)]},
            config,
            stream_mode="messages",
        )

        async for msg, metadata in stream:
            yield msg, metadata

    async def astream(
        self,
        input_data: dict,
        config: dict,
        stream_mode: str = "messages",
    ) -> AsyncIterator[tuple[AIMessage | ToolMessage, dict]]:
        """
        Main entry point for streaming responses through the supervisor.

        This method routes the message to the appropriate agent and streams back
        the response. It's compatible with the existing agent interface used in main.py.

        Args:
            input_data: Dictionary containing "messages" list with user input
            config: Configuration dict with "configurable": {"thread_id": "..."}
            stream_mode: Stream mode (default: "messages")

        Yields:
            Tuples of (message, metadata) from the routed agent's response

        Example:
            >>> supervisor = SupervisorAgent(model="ollama:llama3")
            >>> async for msg, metadata in supervisor.astream(
            ...     {"messages": [HumanMessage("I'd like a turkey sandwich")]},
            ...     {"configurable": {"thread_id": "session-123"}},
            ... ):
            ...     print(msg.text)
        """
        # Extract the user message
        messages = input_data.get("messages", [])
        if not messages:
            return

        # Get the latest human message
        user_message = None
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                user_message = msg.content
                break

        if not user_message:
            return

        # Extract thread ID
        thread_id = config.get("configurable", {}).get("thread_id", "default")

        # Route to appropriate agent
        agent_type = await self.route(user_message, thread_id)

        # If FINISH, yield a final message and return
        if agent_type == "FINISH":
            yield AIMessage(
                content="Thank you for visiting! Have a great day!"
            ), {"thread_id": thread_id}
            return

        # Process with the selected agent
        async for msg, metadata in self.process_with_agent(
            user_message, agent_type, thread_id
        ):
            yield msg, metadata


def create_supervisor_agent(
    model: str,
    checkpointer: InMemorySaver | None = None,
) -> SupervisorAgent:
    """
    Create a supervisor agent that routes between specialized subagents.

    The supervisor analyzes incoming requests and delegates them to either
    the order agent or customer service agent based on the nature of the request.

    Args:
        model: The LLM model identifier (e.g., "ollama:llama3", "anthropic:claude-3")
        checkpointer: Optional checkpointer for conversation memory

    Returns:
        A configured SupervisorAgent instance

    Example:
        >>> from langgraph.checkpoint.memory import InMemorySaver
        >>> supervisor = create_supervisor_agent(
        ...     model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        ...     checkpointer=InMemorySaver()
        ... )
        >>> # Use supervisor.astream() to process requests
    """
    return SupervisorAgent(model=model, checkpointer=checkpointer)
