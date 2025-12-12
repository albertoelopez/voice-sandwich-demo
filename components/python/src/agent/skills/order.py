"""
Order management skills for the voice sandwich shop assistant.

Provides functions to manage customer orders including adding/removing items,
confirming orders, and canceling orders. Maintains order state across the conversation.
"""

from typing import Dict, List, Optional
from datetime import datetime

# Simple in-memory order storage (keyed by thread_id in production)
# In a real system, this would be a database or cache
_orders: Dict[str, Dict] = {}


def _get_or_create_order(order_id: str = "default") -> Dict:
    """Internal helper to get or create an order."""
    if order_id not in _orders:
        _orders[order_id] = {
            "items": [],
            "status": "building",
            "created_at": datetime.now().isoformat(),
            "total": 0.0,
        }
    return _orders[order_id]


def add_to_order(
    item: str,
    quantity: int = 1,
    customizations: Optional[str] = None,
    order_id: str = "default",
) -> str:
    """
    Add an item to the customer's sandwich order.

    Args:
        item: The name of the item to add (e.g., "Turkey Club", "BLT").
        quantity: The number of items to add (default: 1).
        customizations: Optional customizations like "no tomatoes" or "extra cheese".
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message describing what was added to the order.

    Examples:
        >>> add_to_order("Turkey Club", 1)
        "Added 1 x Turkey Club to your order."

        >>> add_to_order("BLT", 2, "no mayo, extra bacon")
        "Added 2 x BLT (no mayo, extra bacon) to your order."

        >>> add_to_order("Italian Sub", 1, "on wheat bread")
        "Added 1 x Italian Sub (on wheat bread) to your order."
    """
    if quantity <= 0:
        return "Please specify a positive quantity."

    order = _get_or_create_order(order_id)

    order_item = {
        "item": item,
        "quantity": quantity,
        "customizations": customizations,
        "added_at": datetime.now().isoformat(),
    }

    order["items"].append(order_item)

    # Build confirmation message
    item_desc = f"{quantity} x {item}"
    if customizations:
        item_desc += f" ({customizations})"

    return f"Added {item_desc} to your order."


def remove_from_order(item: str, order_id: str = "default") -> str:
    """
    Remove an item from the customer's order.

    Args:
        item: The name of the item to remove.
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message or error if the item wasn't found.

    Examples:
        >>> remove_from_order("Turkey Club")
        "Removed Turkey Club from your order."

        >>> remove_from_order("Nonexistent Item")
        "Couldn't find 'Nonexistent Item' in your order."
    """
    if order_id not in _orders:
        return "You don't have any items in your order yet."

    order = _orders[order_id]

    # Search for the item (case-insensitive)
    item_lower = item.lower().strip()
    for i, order_item in enumerate(order["items"]):
        if order_item["item"].lower().strip() == item_lower:
            removed_item = order["items"].pop(i)
            item_name = removed_item["item"]
            return f"Removed {item_name} from your order."

    return f"Couldn't find '{item}' in your order."


def view_order(order_id: str = "default") -> str:
    """
    View the current order contents.

    Args:
        order_id: Order identifier (default: "default").

    Returns:
        A formatted summary of the current order.

    Examples:
        >>> view_order()
        "Your order: 1 x Turkey Club, 2 x BLT (no mayo). Total: 3 items."
    """
    if order_id not in _orders or not _orders[order_id]["items"]:
        return "Your order is empty. What would you like to order?"

    order = _orders[order_id]
    items = []

    for order_item in order["items"]:
        item_str = f"{order_item['quantity']} x {order_item['item']}"
        if order_item.get("customizations"):
            item_str += f" ({order_item['customizations']})"
        items.append(item_str)

    total_items = sum(item["quantity"] for item in order["items"])
    items_summary = ", ".join(items)

    return f"Your order: {items_summary}. Total: {total_items} item{'s' if total_items != 1 else ''}."


def confirm_order(order_id: str = "default") -> str:
    """
    Confirm and finalize the customer's order.

    This marks the order as confirmed and ready to be sent to the kitchen.

    Args:
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message with the order summary.

    Examples:
        >>> confirm_order()
        "Order confirmed: 1 x Turkey Club, 2 x BLT. Sending to the kitchen now!"
    """
    if order_id not in _orders or not _orders[order_id]["items"]:
        return "You don't have any items in your order to confirm."

    order = _orders[order_id]

    # Build order summary
    items = []
    for order_item in order["items"]:
        item_str = f"{order_item['quantity']} x {order_item['item']}"
        if order_item.get("customizations"):
            item_str += f" ({order_item['customizations']})"
        items.append(item_str)

    order_summary = ", ".join(items)

    # Mark order as confirmed
    order["status"] = "confirmed"
    order["confirmed_at"] = datetime.now().isoformat()

    return f"Order confirmed: {order_summary}. Sending to the kitchen now! Your order will be ready in about 10-15 minutes."


def cancel_order(order_id: str = "default") -> str:
    """
    Cancel the current order.

    This clears all items from the order and marks it as cancelled.

    Args:
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message.

    Examples:
        >>> cancel_order()
        "Your order has been cancelled. Let me know if you'd like to start a new order!"
    """
    if order_id not in _orders:
        return "There's no order to cancel."

    order = _orders[order_id]

    if order["status"] == "confirmed":
        # In a real system, you might want to prevent cancellation of confirmed orders
        # or handle it differently
        del _orders[order_id]
        return "Your confirmed order has been cancelled. If you placed this order recently, please check with staff."

    del _orders[order_id]
    return "Your order has been cancelled. Let me know if you'd like to start a new order!"


def modify_item(
    item: str,
    new_customizations: str,
    order_id: str = "default",
) -> str:
    """
    Modify the customizations for an existing item in the order.

    Args:
        item: The name of the item to modify.
        new_customizations: The new customizations to apply.
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message or error if the item wasn't found.

    Examples:
        >>> modify_item("Turkey Club", "no lettuce, extra tomato")
        "Updated Turkey Club: no lettuce, extra tomato"
    """
    if order_id not in _orders or not _orders[order_id]["items"]:
        return "You don't have any items in your order yet."

    order = _orders[order_id]
    item_lower = item.lower().strip()

    for order_item in order["items"]:
        if order_item["item"].lower().strip() == item_lower:
            order_item["customizations"] = new_customizations
            return f"Updated {order_item['item']}: {new_customizations}"

    return f"Couldn't find '{item}' in your order to modify."


def clear_order(order_id: str = "default") -> str:
    """
    Clear all items from the order without canceling it.

    Useful when the customer wants to start over.

    Args:
        order_id: Order identifier (default: "default").

    Returns:
        A confirmation message.

    Examples:
        >>> clear_order()
        "Cleared all items from your order. What would you like to order?"
    """
    if order_id not in _orders:
        return "Your order is already empty."

    order = _orders[order_id]
    order["items"] = []
    order["status"] = "building"

    return "Cleared all items from your order. What would you like to order?"
