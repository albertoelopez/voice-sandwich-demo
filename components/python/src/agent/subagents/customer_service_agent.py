"""
Customer Service Agent - Specialized agent for handling questions and complaints.

This agent is optimized for customer service tasks including:
- Answering questions about menu, ingredients, pricing
- Handling complaints and concerns
- Providing store information (hours, location, etc.)
- Managing dietary restrictions and allergies
"""

from typing import Callable

from langchain.agents import create_agent
from langchain_core.runnables import Runnable
from langgraph.checkpoint.memory import InMemorySaver


def get_menu_info(category: str = "all") -> str:
    """
    Get information about menu items.

    Args:
        category: Menu category to query ("sandwiches", "sides", "drinks", "all")

    Returns:
        Detailed menu information for the requested category
    """
    menu_data = {
        "sandwiches": """
SANDWICHES:
- Classic Turkey ($8): Fresh turkey breast, lettuce, tomato
- Ham & Cheese ($7): Premium ham with your choice of cheese
- Roast Beef ($9): Slow-roasted beef, served hot or cold
- Veggie Delight ($6): Fresh vegetables with hummus spread
All sandwiches come with choice of cheese and toppings.
        """,
        "sides": """
SIDES:
- Potato Chips ($2): Classic or BBQ flavor
- Fresh-Baked Cookie ($2): Chocolate chip or oatmeal raisin
- Dill Pickle ($1): Crispy whole pickle
        """,
        "drinks": """
DRINKS:
- Fountain Soda ($2): Coke, Diet Coke, Sprite, Root Beer
- Bottled Water ($1): Spring water
- Fresh-Brewed Coffee ($3): Regular or decaf
        """,
    }

    if category == "all":
        return "\n".join(menu_data.values())
    return menu_data.get(category.lower(), "Category not found.")


def get_ingredient_info(item: str) -> str:
    """
    Get ingredient information for a menu item (for allergies/dietary restrictions).

    Args:
        item: The menu item to query

    Returns:
        Ingredient and allergen information
    """
    ingredients = {
        "turkey": "Turkey breast, no artificial ingredients. Contains: wheat (bread). "
        "May contain: soy, eggs, dairy (if cheese/mayo added)",
        "ham": "Premium ham. Contains: wheat (bread), pork. "
        "May contain: soy, eggs, dairy (if cheese/mayo added)",
        "roast beef": "Slow-roasted beef. Contains: wheat (bread), beef. "
        "May contain: soy, eggs, dairy (if cheese/mayo added)",
        "veggie": "Fresh vegetables, hummus. Contains: wheat (bread), chickpeas, tahini. "
        "Vegan-friendly option available. May contain: sesame",
    }

    item_lower = item.lower()
    for key, info in ingredients.items():
        if key in item_lower:
            return info

    return (
        "Please specify which sandwich you'd like ingredient information for: "
        "turkey, ham, roast beef, or veggie."
    )


def get_store_info(info_type: str = "hours") -> str:
    """
    Get store information (hours, location, contact).

    Args:
        info_type: Type of information requested ("hours", "location", "contact", "all")

    Returns:
        Requested store information
    """
    store_data = {
        "hours": "Store Hours: Mon-Fri 7am-9pm, Sat-Sun 8am-8pm",
        "location": "Location: 123 Main Street, Downtown District",
        "contact": "Phone: (555) 123-4567, Email: info@sandwichshop.com",
    }

    if info_type == "all":
        return " | ".join(store_data.values())
    return store_data.get(info_type.lower(), "Information type not found.")


def handle_complaint(issue: str) -> str:
    """
    Handle customer complaints and issues.

    Args:
        issue: Description of the customer's complaint

    Returns:
        Response acknowledging the issue and offering resolution
    """
    return (
        f"I sincerely apologize for the issue with {issue}. "
        "Your satisfaction is our top priority. I'm noting this complaint "
        "and our manager will follow up with you shortly. "
        "Would you like a refund or replacement for your order?"
    )


def check_dietary_options(restriction: str) -> str:
    """
    Check menu options for dietary restrictions.

    Args:
        restriction: Type of dietary restriction (e.g., "vegetarian", "vegan", "gluten-free")

    Returns:
        Menu recommendations for the specified dietary restriction
    """
    options = {
        "vegetarian": "Vegetarian options: Veggie Delight sandwich. "
        "You can also customize any sandwich without meat.",
        "vegan": "Vegan options: Veggie Delight (no cheese, no mayo) on wheat bread. "
        "Add oil & vinegar for flavor!",
        "gluten-free": "We currently don't offer gluten-free bread, but we can make a "
        "lettuce wrap version of any sandwich upon request.",
        "dairy-free": "Dairy-free: Skip the cheese and mayo. Use mustard, oil & vinegar instead.",
    }

    restriction_lower = restriction.lower()
    for key, info in options.items():
        if key in restriction_lower:
            return info

    return (
        "Please specify your dietary restriction: vegetarian, vegan, "
        "gluten-free, or dairy-free."
    )


# Customer service tools
CUSTOMER_SERVICE_TOOLS = [
    get_menu_info,
    get_ingredient_info,
    get_store_info,
    handle_complaint,
    check_dietary_options,
]


CUSTOMER_SERVICE_SYSTEM_PROMPT = """
You are a specialized customer service representative for a sandwich shop. \
Your focus is on helping customers with questions, concerns, and information requests.

Your responsibilities:
- Answer questions about the menu, ingredients, and pricing
- Provide information about store hours, location, and contact details
- Handle dietary restrictions and allergy inquiries
- Address complaints with empathy and professionalism
- Help customers make informed menu choices

Important guidelines:
- Be empathetic and understanding, especially with complaints
- Provide accurate information about ingredients and allergens
- Suggest alternatives for dietary restrictions
- Be friendly but professional
- Keep responses concise for voice interaction
- If you don't have specific information, admit it and offer to find out
- Never make promises about things outside your control (e.g., exact wait times)

For complaints:
- Always apologize first
- Acknowledge the customer's frustration
- Offer concrete solutions (refund, replacement, discount)
- Escalate serious issues to a manager

For dietary questions:
- Take allergies seriously - be accurate about ingredients
- Suggest suitable alternatives
- Inform about potential cross-contamination if relevant

${CARTESIA_TTS_SYSTEM_PROMPT}
"""


def create_customer_service_agent(
    model: str,
    checkpointer: InMemorySaver | None = None,
) -> Runnable:
    """
    Create a specialized customer service agent.

    This agent is optimized for handling customer inquiries, complaints,
    and information requests with appropriate tools and empathetic responses.

    Args:
        model: The LLM model identifier (e.g., "ollama:llama3", "anthropic:claude-3")
        checkpointer: Optional checkpointer for conversation memory

    Returns:
        A runnable agent configured for customer service

    Example:
        >>> from langgraph.checkpoint.memory import InMemorySaver
        >>> agent = create_customer_service_agent(
        ...     model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        ...     checkpointer=InMemorySaver()
        ... )
        >>> # Agent is ready to handle customer service requests
    """
    return create_agent(
        model=model,
        tools=CUSTOMER_SERVICE_TOOLS,
        system_prompt=CUSTOMER_SERVICE_SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
