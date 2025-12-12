"""
Menu information skills for the voice sandwich shop assistant.

Provides functions to query menu items, check availability, and get information
about ingredients, prices, and options.
"""

from typing import Dict, List, Optional

# Menu data structure
MENU_DATA = {
    "sandwiches": {
        "turkey_club": {
            "name": "Turkey Club",
            "price": 8.99,
            "description": "Classic turkey with bacon, lettuce, and tomato",
            "available": True,
        },
        "italian_sub": {
            "name": "Italian Sub",
            "price": 9.99,
            "description": "Ham, salami, provolone with Italian dressing",
            "available": True,
        },
        "roast_beef": {
            "name": "Roast Beef",
            "price": 10.99,
            "description": "Premium roast beef with your choice of toppings",
            "available": True,
        },
        "veggie_delight": {
            "name": "Veggie Delight",
            "price": 7.99,
            "description": "Fresh vegetables with choice of cheese and dressing",
            "available": True,
        },
        "blt": {
            "name": "BLT",
            "price": 7.99,
            "description": "Bacon, lettuce, and tomato classic",
            "available": True,
        },
    },
    "meats": {
        "turkey": {"name": "Turkey", "available": True},
        "ham": {"name": "Ham", "available": True},
        "roast_beef": {"name": "Roast Beef", "available": True},
        "bacon": {"name": "Bacon", "available": True},
        "salami": {"name": "Salami", "available": True},
    },
    "cheeses": {
        "swiss": {"name": "Swiss", "available": True},
        "cheddar": {"name": "Cheddar", "available": True},
        "provolone": {"name": "Provolone", "available": True},
        "pepper_jack": {"name": "Pepper Jack", "available": True},
        "american": {"name": "American", "available": True},
    },
    "toppings": {
        "lettuce": {"name": "Lettuce", "available": True},
        "tomato": {"name": "Tomato", "available": True},
        "onion": {"name": "Onion", "available": True},
        "pickles": {"name": "Pickles", "available": True},
        "jalapenos": {"name": "Jalapenos", "available": True},
        "bell_peppers": {"name": "Bell Peppers", "available": True},
        "cucumbers": {"name": "Cucumbers", "available": True},
    },
    "condiments": {
        "mayo": {"name": "Mayo", "available": True},
        "mustard": {"name": "Mustard", "available": True},
        "ranch": {"name": "Ranch", "available": True},
        "italian_dressing": {"name": "Italian Dressing", "available": True},
        "oil_vinegar": {"name": "Oil & Vinegar", "available": True},
        "hot_sauce": {"name": "Hot Sauce", "available": True},
    },
    "breads": {
        "white": {"name": "White", "available": True},
        "wheat": {"name": "Wheat", "available": True},
        "sourdough": {"name": "Sourdough", "available": True},
        "italian": {"name": "Italian", "available": True},
        "wrap": {"name": "Wrap", "available": True},
    },
}


def get_menu_info(category: Optional[str] = None) -> str:
    """
    Get information about menu items and available options.

    Args:
        category: Optional category to filter by. Valid categories:
                  'sandwiches', 'meats', 'cheeses', 'toppings', 'condiments', 'breads'.
                  If None, returns all menu information.

    Returns:
        A formatted string containing menu information.

    Examples:
        >>> get_menu_info("sandwiches")
        "Our sandwiches: Turkey Club ($8.99), Italian Sub ($9.99), ..."

        >>> get_menu_info("meats")
        "Available meats: Turkey, Ham, Roast Beef, Bacon, Salami"

        >>> get_menu_info()
        "Full menu: Sandwiches: ... Meats: ... Cheeses: ..."
    """
    if category:
        category = category.lower().strip()
        if category not in MENU_DATA:
            return f"Category '{category}' not found. Valid categories: {', '.join(MENU_DATA.keys())}"

        items = MENU_DATA[category]
        if category == "sandwiches":
            sandwich_list = [
                f"{item['name']} (${item['price']:.2f})"
                for item in items.values()
                if item["available"]
            ]
            return f"Our sandwiches: {', '.join(sandwich_list)}"
        else:
            item_list = [item["name"] for item in items.values() if item["available"]]
            return f"Available {category}: {', '.join(item_list)}"

    # Return full menu information
    result = []

    # Sandwiches with prices
    sandwiches = [
        f"{item['name']} (${item['price']:.2f})"
        for item in MENU_DATA["sandwiches"].values()
        if item["available"]
    ]
    result.append(f"Sandwiches: {', '.join(sandwiches)}")

    # Other categories
    for category_name in ["meats", "cheeses", "toppings", "condiments", "breads"]:
        items = [
            item["name"]
            for item in MENU_DATA[category_name].values()
            if item["available"]
        ]
        result.append(f"{category_name.capitalize()}: {', '.join(items)}")

    return ". ".join(result) + "."


def check_availability(item_name: str) -> str:
    """
    Check if a specific menu item or ingredient is available.

    Args:
        item_name: The name of the item to check (case-insensitive).

    Returns:
        A string indicating whether the item is available or not.

    Examples:
        >>> check_availability("turkey")
        "Turkey is available."

        >>> check_availability("turkey club")
        "Turkey Club is available and costs $8.99."

        >>> check_availability("chicken")
        "Chicken is not available. Would you like to see what we have?"
    """
    item_name_lower = item_name.lower().strip().replace(" ", "_")

    # Search through all categories
    for category, items in MENU_DATA.items():
        for item_key, item_data in items.items():
            if (
                item_key == item_name_lower
                or item_data["name"].lower() == item_name.lower()
            ):
                if item_data["available"]:
                    if category == "sandwiches":
                        return (
                            f"{item_data['name']} is available and costs "
                            f"${item_data['price']:.2f}. {item_data['description']}"
                        )
                    else:
                        return f"{item_data['name']} is available."
                else:
                    return f"Sorry, {item_data['name']} is currently unavailable."

    return (
        f"{item_name} is not on our menu. "
        "Would you like to hear what we have available?"
    )


def get_sandwich_details(sandwich_name: str) -> str:
    """
    Get detailed information about a specific sandwich.

    Args:
        sandwich_name: The name of the sandwich (case-insensitive).

    Returns:
        Detailed information about the sandwich including price and description.

    Examples:
        >>> get_sandwich_details("turkey club")
        "Turkey Club: Classic turkey with bacon, lettuce, and tomato. Price: $8.99"
    """
    sandwich_name_lower = sandwich_name.lower().strip().replace(" ", "_")

    sandwiches = MENU_DATA["sandwiches"]
    for key, sandwich in sandwiches.items():
        if key == sandwich_name_lower or sandwich["name"].lower() == sandwich_name.lower():
            if sandwich["available"]:
                return (
                    f"{sandwich['name']}: {sandwich['description']}. "
                    f"Price: ${sandwich['price']:.2f}"
                )
            else:
                return f"Sorry, {sandwich['name']} is currently unavailable."

    return f"We don't have a sandwich called '{sandwich_name}'. Would you like to hear our sandwich menu?"


def list_toppings() -> str:
    """
    List all available toppings and condiments.

    Returns:
        A formatted string with all available toppings and condiments.

    Examples:
        >>> list_toppings()
        "Toppings: Lettuce, Tomato, Onion, Pickles... Condiments: Mayo, Mustard..."
    """
    toppings = [
        item["name"]
        for item in MENU_DATA["toppings"].values()
        if item["available"]
    ]
    condiments = [
        item["name"]
        for item in MENU_DATA["condiments"].values()
        if item["available"]
    ]

    return f"Toppings: {', '.join(toppings)}. Condiments: {', '.join(condiments)}."
