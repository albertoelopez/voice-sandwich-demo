"""
Order Agent - Specialized agent for sandwich order taking.

This agent is optimized for handling order-related tasks including:
- Taking new orders
- Adding items to existing orders
- Modifying orders
- Confirming final orders
"""

from typing import Callable

from langchain.agents import create_agent
from langchain_core.runnables import Runnable
from langgraph.checkpoint.memory import InMemorySaver


def add_to_order(item: str, quantity: int) -> str:
    """
    Add an item to the customer's sandwich order.

    Args:
        item: The menu item to add (e.g., "turkey sandwich", "lettuce", "cheddar")
        quantity: Number of items to add

    Returns:
        Confirmation message about the added item
    """
    return f"Added {quantity} x {item} to the order."


def remove_from_order(item: str, quantity: int = 1) -> str:
    """
    Remove an item from the customer's order.

    Args:
        item: The menu item to remove
        quantity: Number of items to remove (default: 1)

    Returns:
        Confirmation message about the removed item
    """
    return f"Removed {quantity} x {item} from the order."


def modify_order_item(item: str, modification: str) -> str:
    """
    Modify an item in the order (e.g., change toppings, size).

    Args:
        item: The menu item to modify
        modification: Description of the modification

    Returns:
        Confirmation message about the modification
    """
    return f"Modified {item}: {modification}"


def confirm_order(order_summary: str) -> str:
    """
    Confirm the final order with the customer.

    Args:
        order_summary: Summary of all items in the order

    Returns:
        Confirmation message that order is being sent to kitchen
    """
    return f"Order confirmed: {order_summary}. Sending to kitchen."


def get_order_status() -> str:
    """
    Get the current status of the order.

    Returns:
        Current order status message
    """
    return "Your order is being prepared. Estimated wait time: 10 minutes."


# Order-specific tools
ORDER_TOOLS = [
    add_to_order,
    remove_from_order,
    modify_order_item,
    confirm_order,
    get_order_status,
]


ORDER_SYSTEM_PROMPT = """
You are a specialized sandwich shop order-taking assistant. Your sole focus is on \
efficiently taking and managing customer orders.

Your responsibilities:
- Take new sandwich orders
- Add items to orders (sandwiches, toppings, sides, drinks)
- Remove or modify items as requested
- Confirm final orders and send them to the kitchen
- Provide order status updates

Available Menu:
SANDWICHES:
- Classic Turkey ($8)
- Ham & Cheese ($7)
- Roast Beef ($9)
- Veggie Delight ($6)

TOPPINGS (included):
- lettuce, tomato, onion, pickles, mayo, mustard, oil & vinegar

CHEESES (included):
- swiss, cheddar, provolone, pepper jack

BREAD OPTIONS:
- white, wheat, sourdough, rye

SIDES:
- chips ($2), cookie ($2), pickle ($1)

DRINKS:
- soda ($2), water ($1), coffee ($3)

Guidelines:
- Be concise, friendly, and efficient
- Always confirm items as you add them
- Ask for clarification if the order is unclear
- Suggest bread type if not specified
- Offer sides and drinks after the main order
- Confirm the complete order before sending to kitchen
- Keep responses short for voice interaction

${CARTESIA_TTS_SYSTEM_PROMPT}
"""


def create_order_agent(
    model: str,
    checkpointer: InMemorySaver | None = None,
) -> Runnable:
    """
    Create a specialized order-taking agent.

    This agent is optimized for handling order-related tasks with appropriate
    tools and system prompts.

    Args:
        model: The LLM model identifier (e.g., "ollama:llama3", "anthropic:claude-3")
        checkpointer: Optional checkpointer for conversation memory

    Returns:
        A runnable agent configured for order taking

    Example:
        >>> from langgraph.checkpoint.memory import InMemorySaver
        >>> agent = create_order_agent(
        ...     model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        ...     checkpointer=InMemorySaver()
        ... )
        >>> # Agent is ready to process order-related requests
    """
    return create_agent(
        model=model,
        tools=ORDER_TOOLS,
        system_prompt=ORDER_SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
