# Skills Usage Examples

This document provides practical examples of how to use the voice sandwich shop skills in different scenarios.

## Quick Start

```typescript
// Import all skills
import { allSkills } from './agent/skills';

// Or import specific skills
import {
  addToOrder,
  getMenuInfo,
  confirmOrder
} from './agent/skills';

// Or import by category
import { orderSkills } from './agent/skills/order';
import { menuSkills } from './agent/skills/menu';
```

## Integration with LangChain Agents

### Using with createAgent

```typescript
import { createAgent } from 'langchain';
import { allSkills } from './agent/skills';

const agent = createAgent({
  model: "anthropic:claude-3-5-sonnet-20241022",
  tools: allSkills,
  systemPrompt: `You are a friendly sandwich shop assistant.
    Help customers order sandwiches, answer menu questions,
    and provide excellent service.`
});

// Invoke the agent
const response = await agent.invoke({
  messages: [
    { role: "user", content: "What are your most popular sandwiches?" }
  ]
});
```

### Using with Existing Order Agent

```typescript
import { createOrderAgent } from './agent/subagents/order-agent';

// The order agent already uses orderSkills internally
const orderAgent = createOrderAgent({
  model: "anthropic:claude-3-5-sonnet-20241022"
});

const result = await orderAgent.invoke({
  messages: [
    { role: "user", content: "I'd like two medium turkey clubs" }
  ]
});
```

## Conversation Flow Examples

### Example 1: Simple Order

```typescript
// Customer: "I'd like a BLT"
await addToOrder.invoke({
  item: "Classic BLT",
  size: "medium",
  quantity: 1
});
// Response: "Added 1 medium Classic BLT to your order."

// Customer: "And chips"
await addToOrder.invoke({
  item: "chips",
  quantity: 1
});
// Response: "Added 1 chips to your order."

// Customer: "That's all"
await confirmOrder.invoke({});
// Response: "Perfect! Your order is confirmed: 1 medium Classic BLT, 1 chips.
//            Your estimated total is $11.98. We're sending it to the kitchen now..."
```

### Example 2: Menu Inquiry

```typescript
// Customer: "What sandwiches do you have?"
await getMenuInfo.invoke({ category: "sandwiches" });
// Returns full list of specialty sandwiches

// Customer: "Tell me about the Turkey Club"
await getSandwichDetails.invoke({ sandwichName: "Turkey Club" });
// Returns detailed ingredients and pricing

// Customer: "Do you have avocado?"
await checkAvailability.invoke({ item: "avocado" });
// Response: "Yes, avocado is available! You can add it to any custom sandwich..."
```

### Example 3: Build Your Own

```typescript
// Customer: "I want to build my own sandwich"
await getMenuInfo.invoke({ category: "meats" });
// Response: "Available meats: turkey, ham, roast beef, bacon..."

await getMenuInfo.invoke({ category: "cheeses" });
// Response: "Available cheeses: swiss, cheddar, provolone..."

// Customer: "I'll have turkey on wheat with swiss cheese"
await addToOrder.invoke({
  item: "Custom sandwich - turkey, swiss, on wheat",
  size: "large",
  quantity: 1
});
```

### Example 4: Order Modification

```typescript
// Customer: "I'd like a Turkey Club and a BLT"
await addToOrder.invoke({ item: "Turkey Club", size: "medium" });
await addToOrder.invoke({ item: "Classic BLT", size: "medium" });

// Customer: "Actually, cancel the BLT"
await removeFromOrder.invoke({ item: "Classic BLT" });
// Response: "Removed 1 medium Classic BLT from your order."

// Customer: "What do I have now?"
await getOrderStatus.invoke({});
// Response: "Here's what you have so far: 1 medium Turkey Club..."
```

### Example 5: Dietary Restrictions

```typescript
// Customer: "I'm vegetarian, what can I have?"
await getDietaryInfo.invoke({ dietary: "vegetarian" });
// Response: "For vegetarian options, try our Veggie Deluxe or build your own..."

// Customer: "What's in the Veggie Deluxe?"
await getSandwichDetails.invoke({ sandwichName: "Veggie Deluxe" });
// Returns full ingredients list

// Customer: "Perfect, I'll take a large Veggie Deluxe"
await addToOrder.invoke({
  item: "Veggie Deluxe",
  size: "large",
  quantity: 1
});
```

### Example 6: Order Cancellation

```typescript
// Customer has items in cart but changes mind
await getOrderStatus.invoke({});
// Shows current order

// Customer: "Actually, nevermind, cancel everything"
await cancelOrder.invoke({
  reason: "Changed my mind"
});
// Response: "No problem, I've cancelled your order..."
```

## Multi-Customer Scenario

```typescript
// Using customer IDs to track different orders
await addToOrder.invoke({
  item: "Turkey Club",
  size: "medium",
  customerId: "customer-123"
});

await addToOrder.invoke({
  item: "BLT",
  size: "large",
  customerId: "customer-456"
});

// Each customer's order is tracked independently
await getOrderStatus.invoke({ customerId: "customer-123" });
// Shows only customer-123's order

await confirmOrder.invoke({ customerId: "customer-456" });
// Confirms only customer-456's order
```

## Error Handling Examples

```typescript
// Removing item that doesn't exist
await removeFromOrder.invoke({ item: "Pizza" });
// Response: "I couldn't find 'Pizza' in your order..."

// Confirming empty order
await confirmOrder.invoke({});
// Response: "There's nothing in your order yet. What would you like to order?"

// Checking unavailable item
await checkAvailability.invoke({ item: "sushi" });
// Response: "Sorry, we don't have sushi available..."
```

## Voice Assistant Integration

### Handling Natural Language

The skills are designed to work with natural language input processed by an LLM:

```typescript
// Customer says: "Can I get two medium turkey sandwiches?"
// LLM extracts parameters and calls:
await addToOrder.invoke({
  item: "Turkey Club",
  quantity: 2,
  size: "medium"
});

// Customer says: "What's popular?"
// LLM calls:
await getMenuInfo.invoke({ category: "popular" });

// Customer says: "I'm vegan, what do you recommend?"
// LLM calls:
await getDietaryInfo.invoke({ dietary: "vegan" });
```

### Voice-Optimized Responses

All responses are designed to be:
- **Concise**: No unnecessary information
- **Conversational**: Natural language flow
- **Clear**: Easy to understand when spoken
- **Actionable**: Provides next steps

```typescript
// Good voice response:
"Added 2 medium Turkey Clubs to your order."

// Not ideal for voice:
"SUCCESS: Order updated. Items: [{name: 'Turkey Club', qty: 2, size: 'M'}]"
```

## Testing Skills Directly

```typescript
// Unit test example
import { describe, it, expect } from 'vitest';
import { addToOrder, getOrderStatus } from './agent/skills';

describe('Order Skills', () => {
  it('should add items to order', async () => {
    const result = await addToOrder.invoke({
      item: "BLT",
      quantity: 1,
      size: "medium",
      customerId: "test-customer"
    });

    expect(result).toContain("Added 1 medium BLT");

    const status = await getOrderStatus.invoke({
      customerId: "test-customer"
    });

    expect(status).toContain("BLT");
  });
});
```

## Advanced Usage

### Custom Pricing Logic

```typescript
// The skills use basic pricing, but you can extend them:
import { MENU_DATA } from './agent/skills/menu';

function calculateCustomPrice(item: string, size: string): number {
  // Add your custom pricing logic
  const basePrice = MENU_DATA.customPrices[size];
  // Apply discounts, taxes, etc.
  return basePrice;
}
```

### Persistent Storage

```typescript
// Replace the in-memory Map with a database
import { redis } from './db';

async function saveOrder(customerId: string, order: Order) {
  await redis.set(`order:${customerId}`, JSON.stringify(order));
}

async function getOrder(customerId: string): Promise<Order> {
  const data = await redis.get(`order:${customerId}`);
  return JSON.parse(data);
}
```

### Webhook Integration

```typescript
// Send orders to kitchen system
async function sendToKitchen(order: Order) {
  await fetch('https://kitchen-api.example.com/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
}
```

## Best Practices

1. **Always validate input**: Use Zod schemas to ensure data integrity
2. **Handle errors gracefully**: Provide helpful error messages
3. **Keep responses concise**: Optimize for voice interactions
4. **Use customer IDs**: Track orders per customer/session
5. **Test thoroughly**: Verify all skills work as expected
6. **Document changes**: Update README when adding new skills

## Next Steps

- Add payment processing skills
- Implement order history tracking
- Add loyalty program integration
- Support order modifications (change size, swap ingredients)
- Add estimated wait time calculations
- Implement delivery/pickup options
