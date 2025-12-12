"""
Voice Sandwich Shop Skills Module

This module provides a comprehensive set of skills for a voice-based sandwich shop
assistant. Skills are organized into two main categories:

1. Menu Skills (menu.py): Query menu items, check availability, get pricing
2. Order Skills (order.py): Manage customer orders, add/remove items, confirm orders

All skills are designed to work seamlessly with LangChain's create_agent function
and are optimized for voice interactions with concise, natural responses.

Usage:
    from agent.skills import all_skills
    from langchain.agents import create_agent

    agent = create_agent(
        model="ollama:llama3.1",
        tools=all_skills,
        system_prompt="You are a helpful sandwich shop assistant."
    )
"""

# Import menu skills
from .menu import (
    get_menu_info,
    check_availability,
    get_sandwich_details,
    list_toppings,
)

# Import order skills
from .order import (
    add_to_order,
    remove_from_order,
    view_order,
    confirm_order,
    cancel_order,
    modify_item,
    clear_order,
)

# Export all individual skills for selective imports
__all__ = [
    # Menu skills
    "get_menu_info",
    "check_availability",
    "get_sandwich_details",
    "list_toppings",
    # Order skills
    "add_to_order",
    "remove_from_order",
    "view_order",
    "confirm_order",
    "cancel_order",
    "modify_item",
    "clear_order",
    # Combined list
    "all_skills",
    # Skill categories
    "menu_skills",
    "order_skills",
]

# Categorized skill lists for selective use
menu_skills = [
    get_menu_info,
    check_availability,
    get_sandwich_details,
    list_toppings,
]

order_skills = [
    add_to_order,
    remove_from_order,
    view_order,
    confirm_order,
    cancel_order,
    modify_item,
    clear_order,
]

# Combined list of all skills - ready for use with LangChain's create_agent
all_skills = menu_skills + order_skills
