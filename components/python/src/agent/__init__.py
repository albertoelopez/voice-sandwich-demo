"""
Agent Package - Multi-agent architecture for voice sandwich ordering.

This package provides specialized agents and supporting components for
building intelligent voice assistants.

Subpackages:
    subagents: Specialized agents with supervisor routing pattern
    skills: Reusable skills and capabilities (future)
"""

# Re-export commonly used subagent functionality for convenience
from agent.subagents import (
    create_customer_service_agent,
    create_order_agent,
    create_supervisor_agent,
)

__all__ = [
    "create_order_agent",
    "create_customer_service_agent",
    "create_supervisor_agent",
]
