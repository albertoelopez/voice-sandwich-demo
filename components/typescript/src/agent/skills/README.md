# Voice Sandwich Shop Skills

This directory contains a modular skills architecture for the TypeScript voice sandwich shop assistant. The skills are built using LangChain's `tool()` function with Zod schemas for type-safe parameter validation.

## Architecture

The skills are organized into two main categories:

1. **Order Management** (`order.ts`) - Tools for managing customer orders
2. **Menu Information** (`menu.ts`) - Tools for querying menu data and availability

All skills are centrally exported through `index.ts` for easy integration with agents.

## Order Management Skills

### `add_to_order`
Add items to the customer's sandwich order.

**Parameters:**
- `item` (string): The item to add (e.g., "Turkey Club", "BLT", "chips")
- `quantity` (number, optional): Quantity of the item (default: 1)
- `size` (string, optional): Size - "small", "medium", or "large"
- `customerId` (string, optional): Customer identifier

**Example:**
```typescript
import { addToOrder } from './skills';

const result = await addToOrder.invoke({
  item: "Turkey Club",
  quantity: 2,
  size: "medium"
});
// Returns: "Added 2 medium Turkey Clubs to your order."
```

### `remove_from_order`
Remove items from the customer's order.

**Parameters:**
- `item` (string): The item to remove
- `customerId` (string, optional): Customer identifier

**Example:**
```typescript
const result = await removeFromOrder.invoke({
  item: "BLT"
});
// Returns: "Removed 1 medium BLT from your order."
```

### `confirm_order`
Confirm and finalize the customer's order.

**Parameters:**
- `customerId` (string, optional): Customer identifier

**Example:**
```typescript
const result = await confirmOrder.invoke({});
// Returns: "Perfect! Your order is confirmed: 2 medium Turkey Clubs.
//           Your estimated total is $20.98. We're sending it to the
//           kitchen now, and it'll be ready in about 10-15 minutes.
//           Your order number is #347."
```

### `cancel_order`
Cancel the current order.

**Parameters:**
- `reason` (string, optional): Optional cancellation reason
- `customerId` (string, optional): Customer identifier

**Example:**
```typescript
const result = await cancelOrder.invoke({
  reason: "Changed my mind"
});
// Returns: "No problem, I've cancelled your order. Reason noted:
//           Changed my mind. Is there anything else I can help you with?"
```

### `get_order_status`
Get the current contents of the order.

**Parameters:**
- `customerId` (string, optional): Customer identifier

**Example:**
```typescript
const result = await getOrderStatus.invoke({});
// Returns: "Here's what you have so far: 2 medium Turkey Clubs.
//           Would you like to add anything else, or are you ready to confirm?"
```

## Menu Information Skills

### `get_menu_info`
Get information about menu categories, items, and prices.

**Parameters:**
- `category` (string): Category to query - "sandwiches", "toppings", "meats", "cheeses", "breads", "condiments", "sides", "drinks", "prices", or "popular"

**Example:**
```typescript
import { getMenuInfo } from './skills';

const result = await getMenuInfo.invoke({
  category: "sandwiches"
});
// Returns detailed list of all specialty sandwiches with descriptions
```

### `check_availability`
Check if a specific item is available.

**Parameters:**
- `item` (string): Item to check (e.g., "turkey", "BLT", "avocado")

**Example:**
```typescript
const result = await checkAvailability.invoke({
  item: "Classic BLT"
});
// Returns: "Yes, we have the Classic BLT! Crispy bacon, fresh lettuce,
//           tomato, and mayo. Available in small ($7.99), medium ($9.99),
//           or large ($11.99)."
```

### `get_sandwich_details`
Get detailed information about a specialty sandwich.

**Parameters:**
- `sandwichName` (string): Name of the sandwich

**Example:**
```typescript
const result = await getSandwichDetails.invoke({
  sandwichName: "Turkey Club"
});
// Returns: "The Turkey Club: Roasted turkey, bacon, lettuce, tomato,
//           and mayo on three slices of bread
//           Ingredients: turkey, bacon, lettuce, tomato, mayo
//           Prices: Small $8.49, Medium $10.49, Large $12.49
//           This is one of our most popular items!"
```

### `get_dietary_info`
Get information about dietary accommodations.

**Parameters:**
- `dietary` (string): Dietary restriction - "vegetarian", "vegan", "gluten-free", etc.

**Example:**
```typescript
const result = await getDietaryInfo.invoke({
  dietary: "vegan"
});
// Returns: "For vegan options, we have the Veggie Deluxe with hummus
//           (hold the cheese), or you can build your own with veggies,
//           avocado, and oil & vinegar on any bread."
```

## Menu Data

The menu includes:

### Specialty Sandwiches
- **Classic BLT** (Popular!) - $7.99 / $9.99 / $11.99
- **Turkey Club** (Popular!) - $8.49 / $10.49 / $12.49
- **Italian Sub** - $8.99 / $10.99 / $12.99
- **Roast Beef & Cheddar** - $8.99 / $10.99 / $12.99
- **Veggie Deluxe** - $6.99 / $8.99 / $10.99
- **The Philly** (Popular!) - $9.49 / $11.49 / $13.49
- **Chicken Caesar Wrap** - $7.99 / $9.99 / $11.99

### Build-Your-Own Ingredients
- **Meats**: turkey, ham, roast beef, bacon, salami, pepperoni, grilled chicken, steak
- **Cheeses**: swiss, cheddar, provolone, american, pepper jack, parmesan
- **Toppings**: lettuce, tomato, onion, pickles, peppers, cucumber, avocado, jalapeños
- **Breads**: white, wheat, sourdough, rye, ciabatta, wrap
- **Condiments**: mayo, mustard, italian dressing, ranch, caesar dressing, horseradish mayo, hummus, oil & vinegar

### Sides & Drinks
- **Sides**: chips ($1.99), coleslaw ($2.49), pickle ($0.99), cookie ($1.99)
- **Drinks**: fountain drink ($2.49), bottled water ($1.99), iced tea ($2.49), lemonade ($2.49)

## Using All Skills Together

Import all skills at once for agent configuration:

```typescript
import { allSkills } from './skills';
import { createAgent } from 'langchain';

const agent = createAgent({
  model: "anthropic:claude-3-5-sonnet-20241022",
  tools: allSkills,
  systemPrompt: "You are a friendly sandwich shop assistant..."
});
```

## Implementation Details

- **State Management**: Order state is stored in-memory using a Map with customerId as the key
- **Type Safety**: All schemas use Zod for runtime validation
- **Voice-Optimized**: Responses are concise and conversational for voice interactions
- **Error Handling**: Graceful fallbacks for missing items or empty orders
- **Extensibility**: Easy to add new skills by following the same pattern

## Future Enhancements

Potential improvements for production use:
- Persistent storage for order state (database, Redis, etc.)
- Webhook integration for sending orders to kitchen systems
- Real-time inventory tracking
- Order history and customer preferences
- Multi-language support
- Payment integration
