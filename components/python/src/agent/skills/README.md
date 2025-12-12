# Voice Sandwich Shop Skills Module

A modular, production-ready skills architecture for LangChain-based voice assistants.

## Overview

This module provides 11 comprehensive skills organized into two categories:
- **Menu Skills** (4 functions): Query menu items, check availability, get pricing
- **Order Skills** (7 functions): Manage customer orders, modifications, and confirmations

All skills are designed for seamless integration with LangChain's `create_agent` and optimized for natural voice interactions.

## Quick Start

```python
from agent.skills import all_skills
from langchain.agents import create_agent

agent = create_agent(
    model="ollama:llama3.1",
    tools=all_skills,  # All 11 skills ready to use
    system_prompt="You are a helpful sandwich shop assistant."
)
```

## File Structure

```
skills/
├── __init__.py      # Central export point, provides all_skills list
├── menu.py          # Menu information and availability skills
├── order.py         # Order management and modification skills
└── README.md        # This file
```

## Available Skills

### Menu Skills (menu.py)

#### `get_menu_info(category: Optional[str] = None) -> str`
Get information about menu items and available options.

**Parameters:**
- `category` (optional): Filter by category - 'sandwiches', 'meats', 'cheeses', 'toppings', 'condiments', 'breads'

**Returns:**
- Formatted string with menu information

**Examples:**
```python
get_menu_info("sandwiches")
# "Our sandwiches: Turkey Club ($8.99), Italian Sub ($9.99), Roast Beef ($10.99)..."

get_menu_info("meats")
# "Available meats: Turkey, Ham, Roast Beef, Bacon, Salami"

get_menu_info()
# Full menu with all categories
```

#### `check_availability(item_name: str) -> str`
Check if a specific menu item or ingredient is available.

**Parameters:**
- `item_name`: Name of item to check (case-insensitive)

**Returns:**
- Availability status with pricing for sandwiches

**Examples:**
```python
check_availability("turkey")
# "Turkey is available."

check_availability("turkey club")
# "Turkey Club is available and costs $8.99. Classic turkey with bacon, lettuce, and tomato"
```

#### `get_sandwich_details(sandwich_name: str) -> str`
Get detailed information about a specific sandwich.

**Parameters:**
- `sandwich_name`: Name of sandwich (case-insensitive)

**Returns:**
- Detailed description with price

**Examples:**
```python
get_sandwich_details("turkey club")
# "Turkey Club: Classic turkey with bacon, lettuce, and tomato. Price: $8.99"
```

#### `list_toppings() -> str`
List all available toppings and condiments.

**Returns:**
- Formatted list of toppings and condiments

**Examples:**
```python
list_toppings()
# "Toppings: Lettuce, Tomato, Onion, Pickles... Condiments: Mayo, Mustard..."
```

### Order Skills (order.py)

#### `add_to_order(item: str, quantity: int = 1, customizations: Optional[str] = None, order_id: str = "default") -> str`
Add an item to the customer's order.

**Parameters:**
- `item`: Item name (e.g., "Turkey Club", "BLT")
- `quantity`: Number of items (default: 1)
- `customizations`: Optional modifications (e.g., "no tomatoes")
- `order_id`: Order identifier (default: "default")

**Returns:**
- Confirmation message

**Examples:**
```python
add_to_order("Turkey Club", 1)
# "Added 1 x Turkey Club to your order."

add_to_order("BLT", 2, "no mayo, extra bacon")
# "Added 2 x BLT (no mayo, extra bacon) to your order."
```

#### `remove_from_order(item: str, order_id: str = "default") -> str`
Remove an item from the order.

**Parameters:**
- `item`: Item name to remove
- `order_id`: Order identifier (default: "default")

**Returns:**
- Confirmation or error message

**Examples:**
```python
remove_from_order("Turkey Club")
# "Removed Turkey Club from your order."
```

#### `view_order(order_id: str = "default") -> str`
View current order contents.

**Parameters:**
- `order_id`: Order identifier (default: "default")

**Returns:**
- Formatted order summary

**Examples:**
```python
view_order()
# "Your order: 1 x Turkey Club, 2 x BLT (no mayo). Total: 3 items."
```

#### `confirm_order(order_id: str = "default") -> str`
Confirm and finalize the order.

**Parameters:**
- `order_id`: Order identifier (default: "default")

**Returns:**
- Confirmation with order summary

**Examples:**
```python
confirm_order()
# "Order confirmed: 1 x Turkey Club, 2 x BLT. Sending to the kitchen now!"
```

#### `cancel_order(order_id: str = "default") -> str`
Cancel the entire order.

**Parameters:**
- `order_id`: Order identifier (default: "default")

**Returns:**
- Cancellation confirmation

**Examples:**
```python
cancel_order()
# "Your order has been cancelled. Let me know if you'd like to start a new order!"
```

#### `modify_item(item: str, new_customizations: str, order_id: str = "default") -> str`
Modify customizations for an existing order item.

**Parameters:**
- `item`: Item name to modify
- `new_customizations`: New customizations to apply
- `order_id`: Order identifier (default: "default")

**Returns:**
- Confirmation or error message

**Examples:**
```python
modify_item("Turkey Club", "no lettuce, extra tomato")
# "Updated Turkey Club: no lettuce, extra tomato"
```

#### `clear_order(order_id: str = "default") -> str`
Clear all items from the order without canceling.

**Parameters:**
- `order_id`: Order identifier (default: "default")

**Returns:**
- Confirmation message

**Examples:**
```python
clear_order()
# "Cleared all items from your order. What would you like to order?"
```

## Menu Data

The module includes a comprehensive menu with:

### Sandwiches (5 items)
- **Turkey Club** - $8.99 - Classic turkey with bacon, lettuce, and tomato
- **Italian Sub** - $9.99 - Ham, salami, provolone with Italian dressing
- **Roast Beef** - $10.99 - Premium roast beef with your choice of toppings
- **Veggie Delight** - $7.99 - Fresh vegetables with choice of cheese and dressing
- **BLT** - $7.99 - Bacon, lettuce, and tomato classic

### Ingredients
- **Meats** (5): Turkey, Ham, Roast Beef, Bacon, Salami
- **Cheeses** (5): Swiss, Cheddar, Provolone, Pepper Jack, American
- **Toppings** (7): Lettuce, Tomato, Onion, Pickles, Jalapenos, Bell Peppers, Cucumbers
- **Condiments** (6): Mayo, Mustard, Ranch, Italian Dressing, Oil & Vinegar, Hot Sauce
- **Breads** (5): White, Wheat, Sourdough, Italian, Wrap

## Import Options

### Import All Skills
```python
from agent.skills import all_skills
agent = create_agent(model="...", tools=all_skills)
```

### Import by Category
```python
from agent.skills import menu_skills, order_skills

# Menu-only agent
agent = create_agent(model="...", tools=menu_skills)

# Order-only agent
agent = create_agent(model="...", tools=order_skills)
```

### Import Specific Skills
```python
from agent.skills import add_to_order, confirm_order, get_menu_info

agent = create_agent(
    model="...",
    tools=[add_to_order, confirm_order, get_menu_info]
)
```

## Integration with main.py

Replace the inline skills in `main.py`:

**Before:**
```python
def add_to_order(item: str, quantity: int) -> str:
    """Add an item to the customer's sandwich order."""
    return f"Added {quantity} x {item} to the order."

def confirm_order(order_summary: str) -> str:
    """Confirm the final order with the customer."""
    return f"Order confirmed: {order_summary}. Sending to kitchen."

agent = create_agent(
    model="ollama:...",
    tools=[add_to_order, confirm_order],
    system_prompt=system_prompt,
)
```

**After:**
```python
from agent.skills import all_skills

agent = create_agent(
    model="ollama:...",
    tools=all_skills,  # Now has 11 comprehensive skills
    system_prompt=system_prompt,
)
```

## Testing

Run the test suite:

```bash
cd components/python
python3 -c "
import sys
sys.path.insert(0, 'src')
from agent.skills import all_skills, add_to_order, get_menu_info, view_order

# Test menu query
print(get_menu_info('sandwiches'))

# Test order flow
print(add_to_order('Turkey Club', 1))
print(add_to_order('BLT', 2, 'no mayo'))
print(view_order())
print(f'Total skills available: {len(all_skills)}')
"
```

## Architecture Benefits

1. **Modular**: Clear separation of concerns (menu vs order)
2. **Maintainable**: Easy to update menu or add new skills
3. **Testable**: Each skill can be tested independently
4. **Type-Safe**: Full type hints for IDE support
5. **Documented**: Comprehensive docstrings (used by LangChain for tool descriptions)
6. **Scalable**: Easy to extend with new categories (payment, loyalty, etc.)
7. **Production-Ready**: Error handling, validation, and state management

## Future Extensions

The architecture supports easy addition of new skill modules:

```
skills/
├── __init__.py
├── menu.py
├── order.py
├── payment.py          # NEW: Payment processing
├── loyalty.py          # NEW: Loyalty program
├── special_offers.py   # NEW: Deals and promotions
└── dietary.py          # NEW: Allergen information
```

Simply add new modules and update `__init__.py`:

```python
from .payment import process_payment, apply_coupon
from .loyalty import get_points, redeem_reward

all_skills = menu_skills + order_skills + payment_skills + loyalty_skills
```

## LangChain Compatibility

All skills are designed as plain Python functions with:
- Clear docstrings (used by LangChain for tool descriptions)
- Type hints (for validation and IDE support)
- Simple return types (str, compatible with tool output)
- Optional parameters with sensible defaults

LangChain automatically converts these functions into tools that the agent can invoke.

## Order State Management

Orders are stored in-memory using a simple dictionary structure:
- **Development**: Uses "default" order_id for single-session testing
- **Production**: Pass thread_id as order_id to maintain per-user orders
- **Future**: Replace `_orders` dict with Redis or database for persistence

Example production usage:
```python
# In _agent_stream function
thread_id = str(uuid4())

# Pass thread_id to skills
add_to_order("Turkey Club", 1, order_id=thread_id)
```

## License

Part of the Voice Sandwich Demo project.
