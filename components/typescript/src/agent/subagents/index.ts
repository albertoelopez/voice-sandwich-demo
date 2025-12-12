/**
 * Subagent Architecture for Sandwich Shop Voice Agent
 *
 * This module provides a supervisor pattern for delegating tasks to specialized subagents.
 * Each subagent is optimized for specific tasks with tailored system prompts and tool subsets.
 */

import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { allSkills } from "../skills";
import { CARTESIA_TTS_SYSTEM_PROMPT } from "../../cartesia";
import {
  createOrderAgent,
  ORDER_AGENT_SYSTEM_PROMPT,
  type OrderAgentConfig,
} from "./order-agent";
import {
  createCustomerServiceAgent,
  CUSTOMER_SERVICE_AGENT_SYSTEM_PROMPT,
  type CustomerServiceAgentConfig,
} from "./customer-service-agent";

/**
 * Export subagent creators for direct use
 */
export { createOrderAgent, createCustomerServiceAgent };
export type { OrderAgentConfig, CustomerServiceAgentConfig };

/**
 * Export system prompts for customization
 */
export { ORDER_AGENT_SYSTEM_PROMPT, CUSTOMER_SERVICE_AGENT_SYSTEM_PROMPT };

/**
 * Agent type enumeration for the supervisor to route to
 */
export enum AgentType {
  ORDER = "order",
  CUSTOMER_SERVICE = "customer_service",
  GENERAL = "general",
}

/**
 * Configuration for creating the supervisor agent
 */
export interface SupervisorAgentConfig {
  /**
   * The model to use for all agents (supervisor and subagents).
   * Examples: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
   */
  model: string;

  /**
   * Optional custom system prompt for the supervisor.
   */
  systemPrompt?: string;

  /**
   * Optional checkpointer for maintaining conversation state.
   * Defaults to MemorySaver if not provided.
   */
  checkpointer?: MemorySaver;
}

/**
 * System prompt for the supervisor agent.
 *
 * The supervisor is responsible for understanding customer intent
 * and routing to the appropriate specialist subagent.
 */
const SUPERVISOR_SYSTEM_PROMPT = `
You are a helpful sandwich shop assistant supervisor. Your role is to understand customer needs and provide assistance directly or route to specialized agents when appropriate.

You have access to ALL tools and can handle any customer interaction. However, you should be aware that:
- Order-related tasks (placing orders, modifying orders, confirming orders) are your primary responsibility
- Customer service tasks (menu questions, complaints, availability checks) are also within your capabilities

Available Menu Items:
- Toppings: lettuce, tomato, onion, pickles, mayo, mustard
- Meats: turkey, ham, roast beef
- Cheeses: swiss, cheddar, provolone
- Breads: white, wheat, sourdough, rye
- Sizes: small ($6.99), medium ($8.99), large ($10.99)

Guidelines:
- Be friendly, efficient, and helpful
- Use the appropriate tools for each task
- Keep responses concise for voice interaction
- Ensure accuracy in order taking
- Show empathy when handling complaints

${CARTESIA_TTS_SYSTEM_PROMPT}
`;

/**
 * Creates a supervisor agent with access to all tools and subagents.
 *
 * The supervisor can handle requests directly or delegate to specialized subagents.
 * This provides a flexible architecture where the supervisor has full capability
 * while also being able to leverage specialized agents for complex scenarios.
 *
 * @param config - Configuration options for the supervisor
 * @returns A configured supervisor agent with access to all tools
 *
 * @example
 * ```typescript
 * const supervisor = createSupervisorAgent({
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 *
 * // Supervisor can handle any request directly
 * const result = await supervisor.invoke({
 *   messages: [new HumanMessage("I'd like to order a sandwich")]
 * });
 * ```
 */
export function createSupervisorAgent(config: SupervisorAgentConfig) {
  const checkpointer = config.checkpointer ?? new MemorySaver();

  return createAgent({
    model: config.model,
    tools: allSkills,
    checkpointer,
    systemPrompt: config.systemPrompt ?? SUPERVISOR_SYSTEM_PROMPT,
  });
}

/**
 * Creates a routing tool that can be used by a supervisor to delegate to subagents.
 *
 * This tool allows the supervisor to explicitly route requests to specialized subagents
 * based on the task type. Useful for more complex multi-agent architectures.
 *
 * @param config - Base configuration for subagents
 * @returns A tool that routes requests to the appropriate subagent
 *
 * @example
 * ```typescript
 * const routingTool = createSubagentRouter({
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 *
 * // Can be included in supervisor's tool set for explicit delegation
 * const supervisor = createAgent({
 *   model: config.model,
 *   tools: [...allSkills, routingTool],
 *   systemPrompt: "You are a supervisor. Use the route_to_subagent tool for complex tasks."
 * });
 * ```
 */
export function createSubagentRouter(config: SupervisorAgentConfig) {
  const checkpointer = config.checkpointer ?? new MemorySaver();

  const orderAgent = createOrderAgent({
    model: config.model,
    checkpointer,
  });

  const serviceAgent = createCustomerServiceAgent({
    model: config.model,
    checkpointer,
  });

  return tool(
    async ({ agentType, task }) => {
      let targetAgent;
      switch (agentType) {
        case AgentType.ORDER:
          targetAgent = orderAgent;
          break;
        case AgentType.CUSTOMER_SERVICE:
          targetAgent = serviceAgent;
          break;
        default:
          return "Invalid agent type. Please specify 'order' or 'customer_service'.";
      }

      try {
        const result = await targetAgent.invoke({
          messages: [{ role: "user", content: task }],
        });
        return JSON.stringify(result);
      } catch (error) {
        return `Error routing to ${agentType} agent: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
    {
      name: "route_to_subagent",
      description:
        "Route a specific task to a specialized subagent. Use 'order' for order-taking tasks or 'customer_service' for menu questions and complaints.",
      schema: z.object({
        agentType: z
          .nativeEnum(AgentType)
          .describe(
            "The type of agent to route to: 'order' for order management, 'customer_service' for questions/complaints"
          ),
        task: z.string().describe("The task or question to send to the subagent"),
      }),
    }
  );
}

/**
 * Factory function to create subagents based on specialization type.
 *
 * This provides a convenient way to create specialized agents without
 * calling individual creation functions.
 *
 * @param type - The type of subagent to create
 * @param config - Base configuration for the agent
 * @returns A specialized agent of the requested type
 *
 * @example
 * ```typescript
 * const orderAgent = createSubagent(AgentType.ORDER, {
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 *
 * const serviceAgent = createSubagent(AgentType.CUSTOMER_SERVICE, {
 *   model: "ollama:hf.co/MaziyarPanahi/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M"
 * });
 * ```
 */
export function createSubagent(
  type: AgentType,
  config: SupervisorAgentConfig
) {
  const checkpointer = config.checkpointer ?? new MemorySaver();

  switch (type) {
    case AgentType.ORDER:
      return createOrderAgent({
        model: config.model,
        checkpointer,
        systemPrompt: config.systemPrompt,
      });
    case AgentType.CUSTOMER_SERVICE:
      return createCustomerServiceAgent({
        model: config.model,
        checkpointer,
        systemPrompt: config.systemPrompt,
      });
    case AgentType.GENERAL:
      return createSupervisorAgent(config);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

/**
 * Utility function to determine which subagent type would be best for a given task.
 *
 * This can be used by a supervisor or routing logic to automatically determine
 * the best subagent for a task without requiring the LLM to explicitly choose.
 *
 * @param task - The task or user message to classify
 * @returns The recommended agent type for handling the task
 *
 * @example
 * ```typescript
 * const task = "What toppings do you have?";
 * const agentType = classifyTask(task); // Returns AgentType.CUSTOMER_SERVICE
 *
 * const agent = createSubagent(agentType, { model: "..." });
 * ```
 */
export function classifyTask(task: string): AgentType {
  const lowerTask = task.toLowerCase();

  // Order-related keywords
  const orderKeywords = [
    "order",
    "buy",
    "purchase",
    "add",
    "remove",
    "cancel",
    "confirm",
    "i want",
    "i'll have",
    "i'd like",
    "get me",
    "sandwich",
  ];

  // Customer service keywords
  const serviceKeywords = [
    "what",
    "which",
    "how much",
    "price",
    "cost",
    "available",
    "have",
    "menu",
    "options",
    "complaint",
    "problem",
    "issue",
  ];

  // Count keyword matches
  const orderScore = orderKeywords.filter((kw) => lowerTask.includes(kw)).length;
  const serviceScore = serviceKeywords.filter((kw) => lowerTask.includes(kw)).length;

  // Determine best agent based on keyword matches
  if (orderScore > serviceScore) {
    return AgentType.ORDER;
  } else if (serviceScore > orderScore) {
    return AgentType.CUSTOMER_SERVICE;
  }

  // Default to general supervisor if unclear
  return AgentType.GENERAL;
}
