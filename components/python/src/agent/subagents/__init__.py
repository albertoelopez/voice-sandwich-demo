"""
Subagents Package - Specialized agents for voice sandwich ordering system.

This package provides a multi-agent architecture with specialized agents for
different aspects of customer interaction:

- OrderAgent: Handles order taking, modifications, and confirmations
- CustomerServiceAgent: Manages questions, complaints, and information requests
- SupervisorAgent: Routes requests to appropriate specialized agents

Usage:
    Basic usage with individual agents:
    >>> from agent.subagents import create_order_agent, create_customer_service_agent
    >>> from langgraph.checkpoint.memory import InMemorySaver
    >>>
    >>> order_agent = create_order_agent(
    ...     model="ollama:llama3",
    ...     checkpointer=InMemorySaver()
    ... )

    Advanced usage with supervisor routing:
    >>> from agent.subagents import create_supervisor_agent
    >>>
    >>> supervisor = create_supervisor_agent(
    ...     model="ollama:llama3",
    ...     checkpointer=InMemorySaver()
    ... )
    >>> # Use supervisor.astream() for automatic routing

Available Tools by Agent:
    Order Agent:
    - add_to_order(item, quantity)
    - remove_from_order(item, quantity)
    - modify_order_item(item, modification)
    - confirm_order(order_summary)
    - get_order_status()

    Customer Service Agent:
    - get_menu_info(category)
    - get_ingredient_info(item)
    - get_store_info(info_type)
    - handle_complaint(issue)
    - check_dietary_options(restriction)

    Supervisor Agent:
    - route_to_agent(next_agent) - Internal routing mechanism
"""

from agent.subagents.customer_service_agent import (
    CUSTOMER_SERVICE_SYSTEM_PROMPT,
    CUSTOMER_SERVICE_TOOLS,
    create_customer_service_agent,
)
from agent.subagents.order_agent import (
    ORDER_SYSTEM_PROMPT,
    ORDER_TOOLS,
    create_order_agent,
)
from agent.subagents.supervisor import (
    SUPERVISOR_SYSTEM_PROMPT,
    SUPERVISOR_TOOLS,
    SupervisorAgent,
    create_supervisor_agent,
)

__all__ = [
    # Order Agent
    "create_order_agent",
    "ORDER_TOOLS",
    "ORDER_SYSTEM_PROMPT",
    # Customer Service Agent
    "create_customer_service_agent",
    "CUSTOMER_SERVICE_TOOLS",
    "CUSTOMER_SERVICE_SYSTEM_PROMPT",
    # Supervisor Agent
    "create_supervisor_agent",
    "SupervisorAgent",
    "SUPERVISOR_TOOLS",
    "SUPERVISOR_SYSTEM_PROMPT",
]
