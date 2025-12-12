import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Menu information and query skills
 * These tools provide information about sandwiches, ingredients, prices, and availability
 */

interface Sandwich {
  name: string;
  description: string;
  ingredients: string[];
  price: { small: number; medium: number; large: number };
  popular?: boolean;
}

const MENU_DATA = {
  // Specialty sandwiches with pre-defined recipes
  sandwiches: [
    {
      name: "Classic BLT",
      description: "Crispy bacon, fresh lettuce, tomato, and mayo",
      ingredients: ["bacon", "lettuce", "tomato", "mayo"],
      price: { small: 7.99, medium: 9.99, large: 11.99 },
      popular: true,
    },
    {
      name: "Turkey Club",
      description: "Roasted turkey, bacon, lettuce, tomato, and mayo on three slices of bread",
      ingredients: ["turkey", "bacon", "lettuce", "tomato", "mayo"],
      price: { small: 8.49, medium: 10.49, large: 12.49 },
      popular: true,
    },
    {
      name: "Italian Sub",
      description: "Ham, salami, pepperoni, provolone, lettuce, tomato, onion, and Italian dressing",
      ingredients: ["ham", "salami", "pepperoni", "provolone", "lettuce", "tomato", "onion", "italian dressing"],
      price: { small: 8.99, medium: 10.99, large: 12.99 },
    },
    {
      name: "Roast Beef & Cheddar",
      description: "Tender roast beef with sharp cheddar, lettuce, tomato, and horseradish mayo",
      ingredients: ["roast beef", "cheddar", "lettuce", "tomato", "horseradish mayo"],
      price: { small: 8.99, medium: 10.99, large: 12.99 },
    },
    {
      name: "Veggie Deluxe",
      description: "Lettuce, tomato, cucumber, peppers, onion, avocado, and hummus",
      ingredients: ["lettuce", "tomato", "cucumber", "peppers", "onion", "avocado", "hummus"],
      price: { small: 6.99, medium: 8.99, large: 10.99 },
    },
    {
      name: "The Philly",
      description: "Sliced steak, grilled peppers and onions, provolone cheese",
      ingredients: ["steak", "peppers", "onion", "provolone"],
      price: { small: 9.49, medium: 11.49, large: 13.49 },
      popular: true,
    },
    {
      name: "Chicken Caesar Wrap",
      description: "Grilled chicken, romaine, parmesan, and Caesar dressing in a wrap",
      ingredients: ["grilled chicken", "romaine", "parmesan", "caesar dressing"],
      price: { small: 7.99, medium: 9.99, large: 11.99 },
    },
  ] as Sandwich[],

  // Build-your-own ingredients
  toppings: ["lettuce", "tomato", "onion", "pickles", "peppers", "cucumber", "avocado", "jalapeños"],
  meats: ["turkey", "ham", "roast beef", "bacon", "salami", "pepperoni", "grilled chicken", "steak"],
  cheeses: ["swiss", "cheddar", "provolone", "american", "pepper jack", "parmesan"],
  breads: ["white", "wheat", "sourdough", "rye", "ciabatta", "wrap"],
  condiments: ["mayo", "mustard", "italian dressing", "ranch", "caesar dressing", "horseradish mayo", "hummus", "oil & vinegar"],

  // Sides and drinks
  sides: [
    { name: "chips", price: 1.99 },
    { name: "coleslaw", price: 2.49 },
    { name: "pickle", price: 0.99 },
    { name: "cookie", price: 1.99 },
  ],
  drinks: [
    { name: "fountain drink", price: 2.49 },
    { name: "bottled water", price: 1.99 },
    { name: "iced tea", price: 2.49 },
    { name: "lemonade", price: 2.49 },
  ],

  // Base pricing for custom sandwiches
  customPrices: {
    small: 6.99,
    medium: 8.99,
    large: 10.99,
  },
};

export const getMenuInfo = tool(
  async ({ category }) => {
    const cat = category.toLowerCase().trim();

    if (cat === "sandwiches" || cat === "sandwich" || cat === "specials" || cat === "specialty") {
      const sandwichList = MENU_DATA.sandwiches
        .map(s => `${s.name}${s.popular ? " (Popular!)" : ""} - ${s.description}`)
        .join("\n");
      return `Our specialty sandwiches:\n${sandwichList}\n\nOr build your own custom sandwich!`;
    }

    if (cat === "toppings" || cat === "veggies" || cat === "vegetables") {
      return `Available toppings: ${MENU_DATA.toppings.join(", ")}`;
    }

    if (cat === "meats" || cat === "meat" || cat === "protein") {
      return `Available meats: ${MENU_DATA.meats.join(", ")}`;
    }

    if (cat === "cheeses" || cat === "cheese") {
      return `Available cheeses: ${MENU_DATA.cheeses.join(", ")}`;
    }

    if (cat === "breads" || cat === "bread") {
      return `Available breads: ${MENU_DATA.breads.join(", ")}`;
    }

    if (cat === "condiments" || cat === "sauces" || cat === "dressing") {
      return `Available condiments: ${MENU_DATA.condiments.join(", ")}`;
    }

    if (cat === "sides" || cat === "side") {
      const sidesList = MENU_DATA.sides.map(s => `${s.name} ($${s.price})`).join(", ");
      return `Available sides: ${sidesList}`;
    }

    if (cat === "drinks" || cat === "drink" || cat === "beverages") {
      const drinksList = MENU_DATA.drinks.map(d => `${d.name} ($${d.price})`).join(", ");
      return `Available drinks: ${drinksList}`;
    }

    if (cat === "prices" || cat === "price" || cat === "cost") {
      return `Sandwich sizes: Small $${MENU_DATA.customPrices.small}, Medium $${MENU_DATA.customPrices.medium}, Large $${MENU_DATA.customPrices.large}. Specialty sandwiches may vary. Sides range from $0.99-$2.49. Drinks are around $1.99-$2.49.`;
    }

    if (cat === "popular" || cat === "favorites" || cat === "best sellers") {
      const popularSandwiches = MENU_DATA.sandwiches
        .filter(s => s.popular)
        .map(s => s.name)
        .join(", ");
      return `Our most popular sandwiches are: ${popularSandwiches}. Would you like to hear more about any of these?`;
    }

    return `I can tell you about: sandwiches, toppings, meats, cheeses, breads, condiments, sides, drinks, prices, or our popular items. What would you like to know?`;
  },
  {
    name: "get_menu_info",
    description: "Get information about menu items, ingredients, prices, or categories. Use this when customers ask about what's available or want recommendations.",
    schema: z.object({
      category: z
        .string()
        .describe("Category to query: sandwiches, toppings, meats, cheeses, breads, condiments, sides, drinks, prices, or popular"),
    }),
  }
);

export const checkAvailability = tool(
  async ({ item }) => {
    const itemLower = item.toLowerCase().trim();

    // Check specialty sandwiches
    const sandwich = MENU_DATA.sandwiches.find(
      s => s.name.toLowerCase() === itemLower
    );
    if (sandwich) {
      return `Yes, we have the ${sandwich.name}! ${sandwich.description} Available in small ($${sandwich.price.small}), medium ($${sandwich.price.medium}), or large ($${sandwich.price.large}).`;
    }

    // Check all ingredients and items
    const allItems = [
      ...MENU_DATA.toppings,
      ...MENU_DATA.meats,
      ...MENU_DATA.cheeses,
      ...MENU_DATA.breads,
      ...MENU_DATA.condiments,
      ...MENU_DATA.sides.map(s => s.name),
      ...MENU_DATA.drinks.map(d => d.name),
    ];

    const isAvailable = allItems.some(
      i => i.toLowerCase() === itemLower
    );

    if (isAvailable) {
      return `Yes, ${item} is available! You can add it to any custom sandwich or order it separately.`;
    }

    return `Sorry, we don't have ${item} available. Would you like me to suggest something similar or tell you what we do have?`;
  },
  {
    name: "check_availability",
    description: "Check if a specific item, ingredient, or sandwich is available on the menu. Use this when customers ask about specific items.",
    schema: z.object({
      item: z.string().describe("Item to check availability for (e.g., 'turkey', 'BLT', 'avocado')"),
    }),
  }
);

export const getSandwichDetails = tool(
  async ({ sandwichName }) => {
    const sandwich = MENU_DATA.sandwiches.find(
      s => s.name.toLowerCase().includes(sandwichName.toLowerCase())
    );

    if (!sandwich) {
      return `I couldn't find a sandwich called "${sandwichName}". Would you like to hear about our available sandwiches?`;
    }

    return `The ${sandwich.name}: ${sandwich.description}\nIngredients: ${sandwich.ingredients.join(", ")}\nPrices: Small $${sandwich.price.small}, Medium $${sandwich.price.medium}, Large $${sandwich.price.large}${sandwich.popular ? "\nThis is one of our most popular items!" : ""}`;
  },
  {
    name: "get_sandwich_details",
    description: "Get detailed information about a specific specialty sandwich including ingredients and pricing. Use this when customers want to know what's in a particular sandwich.",
    schema: z.object({
      sandwichName: z.string().describe("Name of the sandwich to get details for"),
    }),
  }
);

export const getDietaryInfo = tool(
  async ({ dietary }) => {
    const dietaryLower = dietary.toLowerCase().trim();

    if (dietaryLower.includes("vegetarian") || dietaryLower.includes("veggie")) {
      return `For vegetarian options, try our Veggie Deluxe or build your own with our vegetable toppings, cheeses, and condiments. We can make any sandwich without meat!`;
    }

    if (dietaryLower.includes("vegan")) {
      return `For vegan options, we have the Veggie Deluxe with hummus (hold the cheese), or you can build your own with veggies, avocado, and oil & vinegar on any bread.`;
    }

    if (dietaryLower.includes("gluten")) {
      return `Sorry, we don't currently offer gluten-free bread. However, we can make any of our sandwiches as a salad or lettuce wrap instead!`;
    }

    if (dietaryLower.includes("dairy") || dietaryLower.includes("lactose")) {
      return `For dairy-free options, we can make any sandwich without cheese and use oil & vinegar or hummus instead of mayo-based dressings.`;
    }

    return `I can help with vegetarian, vegan, gluten-free, or dairy-free options. What dietary needs do you have?`;
  },
  {
    name: "get_dietary_info",
    description: "Get information about dietary accommodations and special dietary options. Use this when customers ask about vegetarian, vegan, gluten-free, or other dietary needs.",
    schema: z.object({
      dietary: z.string().describe("Dietary restriction or preference to inquire about"),
    }),
  }
);

export const menuSkills = [
  getMenuInfo,
  checkAvailability,
  getSandwichDetails,
  getDietaryInfo,
];
