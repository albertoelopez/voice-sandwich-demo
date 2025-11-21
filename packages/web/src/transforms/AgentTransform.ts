import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { type ReactAgent } from "langchain";
import { randomUUID } from "node:crypto";

/**
 * Input: User Text (String)
 * Output: AI Tokens (String) - Streamed
 */
export class AgentTransform extends TransformStream<string, AIMessageChunk> {
  constructor(graph: ReactAgent) {
    const threadId = randomUUID();

    super({
      async transform(text, controller) {
        const graphStream = await graph.stream(
          { messages: [new HumanMessage(text)] },
          {
            configurable: { thread_id: threadId },
            streamMode: "messages",
          }
        );
        for await (const [chunk] of graphStream) {
          if (AIMessageChunk.isInstance(chunk)) {
            controller.enqueue(chunk);
          }
        }
      },
    });
  }
}
