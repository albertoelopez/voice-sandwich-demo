import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { orderSkills } from "../skills/order";
import { CARTESIA_TTS_SYSTEM_PROMPT } from "../../cartesia";

/**
 * System prompt for the order-taking specialist agent.
 *
 * This agent is optimized for taking customer orders efficiently.
 * It focuses on order management tasks and uses a friendly, efficient tone.
 */
const ORDER_AGENT_SYSTEM_PROMPT = `
You are a friendly and efficient sandwich shop order specialist. Your primary goal is to help customers place their orders quickly and accurately.

Key Responsibilities:
- Take new orders from customers
- Add items to the customer's current order
- Remove items from orders if requested
- Confirm final orders before sending to the kitchen
- Handle order cancellations if needed

Guidelines:
- Be concise and friendly in your responses
- Ask clarifying questions when needed (size, toppings, etc.)
- Repeat back the order to ensure accuracy
- Use the available tools to manage the order state
- Keep responses brief to maintain conversation flow

Available Menu Items:
- Toppings: lettuce, tomato, onion, pickles, mayo, mustard
- Meats: turkey, ham, roast beef
- Cheeses: swiss, cheddar, provolone
- Breads: white, wheat, sourdough, rye
- Sizes: small ($6.99), medium ($8.99), large ($10.99)

${CARTESIA_TTS_SYSTEM_PROMPT}
`;

/**
 * Configuration options for creating an order agent.
 */
export interface OrderAgentConfig {
  /**
   * The model to use for the agent.
   * Examples: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
   */
  model: string;

  /**
   * Optional custom system prompt to override the default.
   */
  systemPrompt?: string;

  /**
   * Optional checkpointer for maintaining conversation state.
   * Defaults to MemorySaver if not provided.
   */
  checkpointer?: MemorySaver;
}

/**
 * Creates a specialized order-taking agent.
 *
 * This agent is equipped with order management tools and optimized
 * for efficient order processing.
 *
 * @param config - Configuration options for the agent
 * @returns A configured LangChain agent specialized for order taking
 *
 * @example
 * ```typescript
 * const orderAgent = createOrderAgent({
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 *
 * const result = await orderAgent.invoke({
 *   messages: [new HumanMessage("I'd like a turkey sandwich")]
 * });
 * ```
 */
export function createOrderAgent(config: OrderAgentConfig) {
  return createAgent({
    model: config.model,
    tools: orderSkills,
    checkpointer: config.checkpointer ?? new MemorySaver(),
    systemPrompt: config.systemPrompt ?? ORDER_AGENT_SYSTEM_PROMPT,
  });
}

/**
 * Default system prompt for order agents.
 * Exported for reuse or customization.
 */
export { ORDER_AGENT_SYSTEM_PROMPT };
