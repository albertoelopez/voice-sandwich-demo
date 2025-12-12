import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Order management skills for the sandwich shop
 * These tools handle adding, removing, confirming, and canceling orders
 */

// In-memory order state (in production, this would be stored in a database or session)
const orderState = new Map<string, { items: Array<{ item: string; quantity: number; size?: string }> }>();

export const addToOrder = tool(
  async ({ item, quantity, size, customerId = "default" }) => {
    if (!orderState.has(customerId)) {
      orderState.set(customerId, { items: [] });
    }

    const order = orderState.get(customerId)!;
    const existingItemIndex = order.items.findIndex(
      i => i.item.toLowerCase() === item.toLowerCase() && i.size === size
    );

    if (existingItemIndex >= 0) {
      order.items[existingItemIndex].quantity += quantity;
      const total = order.items[existingItemIndex].quantity;
      return `Updated your order: now ${total} ${size ? size + " " : ""}${item}${total > 1 ? "s" : ""} in total.`;
    } else {
      order.items.push({ item, quantity, size });
      return `Added ${quantity} ${size ? size + " " : ""}${item}${quantity > 1 ? "s" : ""} to your order.`;
    }
  },
  {
    name: "add_to_order",
    description: "Add an item to the customer's sandwich order. Use this when the customer wants to order a sandwich, drink, or side.",
    schema: z.object({
      item: z.string().describe("The item to add to the order (e.g., 'Turkey Club', 'BLT', 'chips')"),
      quantity: z.number().default(1).describe("Quantity of the item"),
      size: z.string().optional().describe("Size of the item: small, medium, or large"),
      customerId: z.string().optional().describe("Customer identifier"),
    }),
  }
);

export const removeFromOrder = tool(
  async ({ item, customerId = "default" }) => {
    const order = orderState.get(customerId);

    if (!order || order.items.length === 0) {
      return "Your order is already empty.";
    }

    const itemIndex = order.items.findIndex(
      i => i.item.toLowerCase() === item.toLowerCase()
    );

    if (itemIndex >= 0) {
      const removedItem = order.items.splice(itemIndex, 1)[0];
      return `Removed ${removedItem.quantity} ${removedItem.size ? removedItem.size + " " : ""}${removedItem.item}${removedItem.quantity > 1 ? "s" : ""} from your order.`;
    }

    return `I couldn't find "${item}" in your order. Would you like me to tell you what's currently in your order?`;
  },
  {
    name: "remove_from_order",
    description: "Remove an item from the customer's order. Use this when the customer wants to take something off their order.",
    schema: z.object({
      item: z.string().describe("The item to remove from the order"),
      customerId: z.string().optional().describe("Customer identifier"),
    }),
  }
);

export const confirmOrder = tool(
  async ({ customerId = "default" }) => {
    const order = orderState.get(customerId);

    if (!order || order.items.length === 0) {
      return "There's nothing in your order yet. What would you like to order?";
    }

    const orderSummary = order.items
      .map(i => `${i.quantity} ${i.size ? i.size + " " : ""}${i.item}${i.quantity > 1 ? "s" : ""}`)
      .join(", ");

    // Calculate estimated total (basic pricing)
    const estimatedTotal = order.items.reduce((sum, i) => {
      let price = 8.99; // default medium price
      if (i.size === "small") price = 6.99;
      if (i.size === "large") price = 10.99;
      return sum + (price * i.quantity);
    }, 0);

    return `Perfect! Your order is confirmed: ${orderSummary}. Your estimated total is $${estimatedTotal.toFixed(2)}. We're sending it to the kitchen now, and it'll be ready in about 10-15 minutes. Your order number is #${Math.floor(Math.random() * 1000 + 100)}.`;
  },
  {
    name: "confirm_order",
    description: "Confirm the final order with the customer and send it to the kitchen. Use this after the customer has finished ordering and is ready to complete their purchase.",
    schema: z.object({
      customerId: z.string().optional().describe("Customer identifier"),
    }),
  }
);

export const cancelOrder = tool(
  async ({ reason, customerId = "default" }) => {
    const order = orderState.get(customerId);

    if (!order || order.items.length === 0) {
      return "There's no active order to cancel.";
    }

    orderState.delete(customerId);

    if (reason) {
      return `No problem, I've cancelled your order. Reason noted: ${reason}. Is there anything else I can help you with?`;
    }

    return "Your order has been cancelled. No worries! Let me know if you'd like to start a new order.";
  },
  {
    name: "cancel_order",
    description: "Cancel the customer's current order. Use this when the customer wants to cancel or start over.",
    schema: z.object({
      reason: z.string().optional().describe("Optional reason for cancellation"),
      customerId: z.string().optional().describe("Customer identifier"),
    }),
  }
);

export const getOrderStatus = tool(
  async ({ customerId = "default" }) => {
    const order = orderState.get(customerId);

    if (!order || order.items.length === 0) {
      return "You don't have any items in your order yet. What would you like to order?";
    }

    const orderSummary = order.items
      .map(i => `${i.quantity} ${i.size ? i.size + " " : ""}${i.item}${i.quantity > 1 ? "s" : ""}`)
      .join(", ");

    return `Here's what you have so far: ${orderSummary}. Would you like to add anything else, or are you ready to confirm?`;
  },
  {
    name: "get_order_status",
    description: "Get the current status and contents of the customer's order. Use this when the customer asks what's in their order or wants to review it.",
    schema: z.object({
      customerId: z.string().optional().describe("Customer identifier"),
    }),
  }
);

export const orderSkills = [
  addToOrder,
  removeFromOrder,
  confirmOrder,
  cancelOrder,
  getOrderStatus,
];
