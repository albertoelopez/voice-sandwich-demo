# Skills Architecture Integration Guide

This guide explains how to integrate the new modular skills architecture into your voice sandwich shop assistant.

## Overview

The skills module is organized into three files:

1. **`__init__.py`** - Central export point for all skills
2. **`order.py`** - Order management skills (7 functions)
3. **`menu.py`** - Menu information skills (4 functions)

## Quick Integration

To integrate the new skills into `main.py`, replace the current inline skills with:

```python
# Import skills from the modular architecture
from agent.skills import all_skills

# Update the agent configuration
agent = create_agent(
    model="ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    tools=all_skills,  # Use all 11 skills
    system_prompt=system_prompt,
    checkpointer=InMemorySaver(),
)
```

## Available Skills

### Menu Skills (4 functions)

- **`get_menu_info(category=None)`** - Get menu items by category or full menu
- **`check_availability(item_name)`** - Check if specific item is available
- **`get_sandwich_details(sandwich_name)`** - Get detailed info about a sandwich
- **`list_toppings()`** - List all available toppings and condiments

### Order Skills (7 functions)

- **`add_to_order(item, quantity=1, customizations=None)`** - Add item to order
- **`remove_from_order(item)`** - Remove item from order
- **`view_order()`** - View current order contents
- **`confirm_order()`** - Confirm and finalize the order
- **`cancel_order()`** - Cancel the entire order
- **`modify_item(item, new_customizations)`** - Update item customizations
- **`clear_order()`** - Clear all items without canceling

## Selective Import Options

You can import specific skill categories:

```python
# Import only menu skills
from agent.skills import menu_skills

agent = create_agent(
    model="...",
    tools=menu_skills,  # Only 4 menu-related skills
    system_prompt=system_prompt,
)
```

```python
# Import only order skills
from agent.skills import order_skills

agent = create_agent(
    model="...",
    tools=order_skills,  # Only 7 order-related skills
    system_prompt=system_prompt,
)
```

```python
# Import specific skills
from agent.skills import add_to_order, confirm_order, get_menu_info

agent = create_agent(
    model="...",
    tools=[add_to_order, confirm_order, get_menu_info],
    system_prompt=system_prompt,
)
```

## Updated System Prompt

You can simplify the system prompt since menu data is now in the skills:

```python
system_prompt = """
You are a helpful sandwich shop assistant. Your goal is to take the user's order.
Be concise and friendly.

Use the get_menu_info and check_availability tools to answer questions about our menu.
Use the add_to_order, view_order, and confirm_order tools to manage the customer's order.

${CARTESIA_TTS_SYSTEM_PROMPT}
"""
```

## Menu Data

The menu includes:

- **5 Sandwiches**: Turkey Club ($8.99), Italian Sub ($9.99), Roast Beef ($10.99), Veggie Delight ($7.99), BLT ($7.99)
- **5 Meats**: Turkey, Ham, Roast Beef, Bacon, Salami
- **5 Cheeses**: Swiss, Cheddar, Provolone, Pepper Jack, American
- **7 Toppings**: Lettuce, Tomato, Onion, Pickles, Jalapenos, Bell Peppers, Cucumbers
- **6 Condiments**: Mayo, Mustard, Ranch, Italian Dressing, Oil & Vinegar, Hot Sauce
- **5 Breads**: White, Wheat, Sourdough, Italian, Wrap

## Example Usage

```python
# Customer: "What sandwiches do you have?"
# Agent calls: get_menu_info("sandwiches")
# Returns: "Our sandwiches: Turkey Club ($8.99), Italian Sub ($9.99)..."

# Customer: "I'll have a turkey club"
# Agent calls: add_to_order("Turkey Club", 1)
# Returns: "Added 1 x Turkey Club to your order."

# Customer: "Actually make that no tomatoes"
# Agent calls: modify_item("Turkey Club", "no tomatoes")
# Returns: "Updated Turkey Club: no tomatoes"

# Customer: "What's in my order?"
# Agent calls: view_order()
# Returns: "Your order: 1 x Turkey Club (no tomatoes). Total: 1 item."

# Customer: "That's perfect, confirm it"
# Agent calls: confirm_order()
# Returns: "Order confirmed: 1 x Turkey Club (no tomatoes). Sending to the kitchen now!"
```

## Testing

Test the skills module:

```bash
cd components/python
python3 -c "
from agent.skills import all_skills, add_to_order, get_menu_info

print('Menu:', get_menu_info('sandwiches'))
print('Order:', add_to_order('Turkey Club', 1))
print(f'Total skills: {len(all_skills)}')
"
```

## Benefits

1. **Modular**: Skills organized by functionality
2. **Maintainable**: Easy to add/modify skills without touching main.py
3. **Testable**: Each skill can be tested independently
4. **Documented**: Comprehensive docstrings for LangChain tool descriptions
5. **Scalable**: Easy to add new skill categories (e.g., payment, loyalty)
6. **Type-Safe**: Type hints for better IDE support and error catching

## Future Extensions

The architecture supports easy addition of new skill categories:

- `payment.py` - Payment processing skills
- `loyalty.py` - Loyalty program management
- `special_offers.py` - Special deals and promotions
- `dietary.py` - Dietary restrictions and allergen information
