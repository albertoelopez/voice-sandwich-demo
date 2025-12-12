import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { menuSkills } from "../skills/menu";
import { CARTESIA_TTS_SYSTEM_PROMPT } from "../../cartesia";

/**
 * System prompt for the customer service specialist agent.
 *
 * This agent is optimized for handling customer inquiries, questions,
 * and complaints with empathy and thorough menu knowledge.
 */
const CUSTOMER_SERVICE_AGENT_SYSTEM_PROMPT = `
You are a knowledgeable and empathetic sandwich shop customer service specialist. Your primary goal is to help customers with questions, provide information, and resolve any concerns.

Key Responsibilities:
- Answer questions about menu items and ingredients
- Provide information about prices and options
- Check availability of specific items
- Handle customer complaints with empathy
- Offer alternatives when items are unavailable
- Educate customers about menu offerings

Guidelines:
- Be warm, patient, and understanding
- Provide detailed information when asked
- Use the available tools to look up accurate menu data
- Acknowledge concerns and show empathy
- Offer helpful suggestions and alternatives
- Keep responses conversational and friendly

Menu Knowledge:
- Toppings: lettuce, tomato, onion, pickles, mayo, mustard
- Meats: turkey, ham, roast beef
- Cheeses: swiss, cheddar, provolone
- Breads: white, wheat, sourdough, rye
- Sizes: small ($6.99), medium ($8.99), large ($10.99)

When handling complaints:
- Acknowledge the customer's feelings
- Apologize sincerely when appropriate
- Offer solutions or alternatives
- Thank them for their feedback

${CARTESIA_TTS_SYSTEM_PROMPT}
`;

/**
 * Configuration options for creating a customer service agent.
 */
export interface CustomerServiceAgentConfig {
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
 * Creates a specialized customer service agent.
 *
 * This agent is equipped with menu information tools and optimized
 * for handling customer inquiries and complaints with empathy.
 *
 * @param config - Configuration options for the agent
 * @returns A configured LangChain agent specialized for customer service
 *
 * @example
 * ```typescript
 * const serviceAgent = createCustomerServiceAgent({
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 *
 * const result = await serviceAgent.invoke({
 *   messages: [new HumanMessage("What toppings do you have?")]
 * });
 * ```
 */
export function createCustomerServiceAgent(config: CustomerServiceAgentConfig) {
  return createAgent({
    model: config.model,
    tools: menuSkills,
    checkpointer: config.checkpointer ?? new MemorySaver(),
    systemPrompt: config.systemPrompt ?? CUSTOMER_SERVICE_AGENT_SYSTEM_PROMPT,
  });
}

/**
 * Default system prompt for customer service agents.
 * Exported for reuse or customization.
 */
export { CUSTOMER_SERVICE_AGENT_SYSTEM_PROMPT };
