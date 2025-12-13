import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { createAgent, AIMessage, ToolMessage } from "langchain";
import path from "node:path";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../../../.env") });
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { createNodeWebSocket } from "@hono/node-ws";
import type { WSContext } from "hono/ws";
import type WebSocket from "ws";
import { iife, writableIterator } from "./utils";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { CARTESIA_TTS_SYSTEM_PROMPT, CartesiaTTS } from "./cartesia";
import { AssemblyAISTT } from "./assemblyai/index";
import type { VoiceAgentEvent } from "./types";
import { allSkills } from "./agent/skills";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";

const STATIC_DIR = path.join(__dirname, "../../web/dist");
const PORT = parseInt(process.env.PORT ?? "8000");

if (!existsSync(STATIC_DIR)) {
  console.error(
    `Web build not found at ${STATIC_DIR}.\n` +
      "Run 'make build-web' or 'make dev-ts' from the project root."
  );
  process.exit(1);
}

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use("/*", cors());

const systemPrompt = `
You are a friendly and helpful sandwich shop voice assistant. Your goal is to help customers with their orders and answer questions about our menu.

Conversation Flow:
1. Greet the customer warmly (no tools needed for greetings!)
2. When taking an order, follow this sequence:
   - Ask what size sandwich they'd like (small, medium, or large)
   - Once they choose a size, ask what TYPE of sandwich they want
   - Then ask about customizations (toppings, condiments)
   - Finally, ask about sides and drinks
3. Use tools ONLY when you need specific information you don't already know
4. When you DO use a tool, incorporate the results directly into your response

Tool Usage Guidelines:
- DON'T use tools for simple greetings or acknowledgments
- DO use get_menu_info when customer asks "what sandwiches do you have?" or similar
- DO use order management tools when customer wants to add/modify their order
- After using a tool, USE THE RESULTS in your response - don't ignore them!

Response Guidelines:
- Be conversational and friendly
- Keep responses concise for voice (1-2 sentences)
- Don't repeat information unnecessarily
- Follow the natural order: size → type → customization → sides/drinks
- Acknowledge what the customer just said before moving to the next question

${CARTESIA_TTS_SYSTEM_PROMPT}
`;

// Use local Ollama (Groq has function calling format issues with LangChain)
function getModel() {
  console.log("🦙 Using local Ollama (llama3.1:8b) with tool support");
  return new ChatOllama({
    model: "llama3.1:8b",
    temperature: 0.5,
    baseUrl: "http://localhost:11434", // Default Ollama URL
  });

  // Groq temporarily disabled due to malformed function call format
  // Error: Groq generates '<function=name{...}>' instead of proper JSON
  // if (process.env.GROQ_API_KEY) {
  //   return new ChatGroq({
  //     apiKey: process.env.GROQ_API_KEY,
  //     model: "llama-3.3-70b-versatile",
  //     temperature: 0.5,
  //   });
  // }
}

const agent = createAgent({
  model: getModel(),
  tools: allSkills,
  systemPrompt: systemPrompt,
});

/**
 * Transform stream: Audio (Uint8Array) → Voice Events (VoiceAgentEvent)
 *
 * This function takes a stream of audio chunks and sends them to AssemblyAI for STT.
 *
 * It uses a producer-consumer pattern where:
 * - Producer: Reads audio chunks from audioStream and sends them to AssemblyAI
 * - Consumer: Receives transcription events from AssemblyAI and yields them
 *
 * @param audioStream - Async iterator of PCM audio bytes (16-bit, mono, 16kHz)
 * @returns Async generator yielding STT events (stt_chunk for partials, stt_output for final transcripts)
 */
async function* sttStream(
  audioStream: AsyncIterable<Uint8Array>
): AsyncGenerator<VoiceAgentEvent> {
  const stt = new AssemblyAISTT({ sampleRate: 16000 });
  const passthrough = writableIterator<VoiceAgentEvent>();

  /**
   * Promise that pumps audio chunks to AssemblyAI.
   *
   * This runs concurrently with the consumer, continuously reading audio
   * chunks from the input stream and forwarding them to AssemblyAI.
   * This allows transcription to begin before all audio has arrived.
   */
  const producer = iife(async () => {
    try {
      // Stream each audio chunk to AssemblyAI as it arrives
      for await (const audioChunk of audioStream) {
        await stt.sendAudio(audioChunk);
      }
    } finally {
      // Signal to AssemblyAI that audio streaming is complete
      await stt.close();
    }
  });

  /**
   * Promise that receives transcription events from AssemblyAI.
   *
   * This runs concurrently with the producer, listening for STT events
   * and pushing them into the passthrough iterator for downstream stages.
   */
  const consumer = iife(async () => {
    for await (const event of stt.receiveEvents()) {
      passthrough.push(event);
    }
  });

  try {
    // Yield events as they arrive from the consumer
    yield* passthrough;
  } finally {
    // Wait for the producer and consumer to complete when cleaning up
    await Promise.all([producer, consumer]);
  }
}

/**
 * Transform stream: Voice Events → Voice Events (with Agent Responses)
 *
 * This function takes a stream of upstream voice agent events and processes them.
 * When an stt_output event arrives, it passes the transcript to the LangChain agent.
 * The agent streams back its response tokens as agent_chunk events.
 * Tool calls and results are also emitted as separate events.
 * All other upstream events are passed through unchanged.
 *
 * @param eventStream - An async iterator of upstream voice agent events
 * @returns Async generator yielding all upstream events plus agent_chunk, tool_call, and tool_result events
 */
async function* agentStream(
  eventStream: AsyncIterable<VoiceAgentEvent>
): AsyncGenerator<VoiceAgentEvent> {
  // Generate a unique thread ID for this conversation session
  // This allows the agent to maintain conversation context across multiple turns
  // using the checkpointer (MemorySaver) configured in the agent
  const threadId = uuidv4();

  for await (const event of eventStream) {
    yield event;
    if (event.type === "stt_output") {
      console.log("🎤 User said:", event.transcript);

      // Pre-filter simple greetings to avoid unnecessary tool calls
      const greetingPattern = /^(hello|hi|hey|good morning|good afternoon|good evening)\.?$/i;
      if (greetingPattern.test(event.transcript.trim())) {
        console.log("👋 Detected greeting, responding directly without tools");
        yield {
          type: "agent_chunk",
          text: "Hi! Welcome to our sandwich shop. What size sandwich would you like? We have small, medium, or large.",
          ts: Date.now()
        };
        yield { type: "agent_end", ts: Date.now() };
        continue;
      }

      try {
        console.log("📡 Calling agent.stream()...");
        const stream = await agent.stream(
          { messages: [new HumanMessage(event.transcript)] },
          {
            streamMode: "messages",
          }
        );
        console.log("📡 Stream created, starting to read messages...");

      let messageCount = 0;
      for await (const [message] of stream) {
        messageCount++;
        console.log(`📨 Message ${messageCount}:`, message.constructor.name, typeof message);

        if (AIMessage.isInstance(message)) {
          console.log("  ✓ Is AIMessage, text:", message.text, "tool_calls:", message.tool_calls?.length || 0);
          if (message.text) {
            console.log("🤖 Agent response:", message.text);
            yield { type: "agent_chunk", text: message.text, ts: Date.now() };
          }
          if (message.tool_calls) {
            for (const toolCall of message.tool_calls) {
              console.log("🔧 Tool call:", toolCall.name);
              yield {
                type: "tool_call",
                id: toolCall.id ?? uuidv4(),
                name: toolCall.name,
                args: toolCall.args,
                ts: Date.now(),
              };
            }
          }
        }
        if (ToolMessage.isInstance(message)) {
          console.log("  ✓ Is ToolMessage");
          yield {
            type: "tool_result",
            toolCallId: message.tool_call_id ?? "",
            name: message.name ?? "unknown",
            result:
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content),
            ts: Date.now(),
          };
        }
      }
        console.log(`✅ Stream finished, processed ${messageCount} messages`);

        // Signal that the agent has finished responding for this turn
        yield { type: "agent_end", ts: Date.now() };
      } catch (error) {
        console.error("❌ Agent error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        yield { type: "agent_end", ts: Date.now() };
      }
    }
  }
}

/**
 * Transform stream: Voice Events → Voice Events (with Audio)
 *
 * This function takes a stream of upstream voice agent events and processes them.
 * When agent_chunk events arrive, it sends the text to ElevenLabs for TTS synthesis.
 * Audio is streamed back as tts_chunk events as it's generated.
 * All upstream events are passed through unchanged.
 *
 * It uses a producer-consumer pattern where:
 * - Producer: Reads events from eventStream, passes them through, and sends agent text to ElevenLabs
 * - Consumer: Receives audio chunks from ElevenLabs and yields them as tts_chunk events
 *
 * @param eventStream - An async iterator of upstream voice agent events
 * @returns Async generator yielding all upstream events plus tts_chunk events for synthesized audio
 */
async function* ttsStream(
  eventStream: AsyncIterable<VoiceAgentEvent>
): AsyncGenerator<VoiceAgentEvent> {
  const tts = new CartesiaTTS({
    voiceId: "f6ff7c0c-e396-40a9-a70b-f7607edb6937",
  });
  const passthrough = writableIterator<VoiceAgentEvent>();

  /**
   * Promise that reads events from the upstream stream and sends text to Cartesia.
   *
   * This runs concurrently with the consumer, continuously reading events
   * from the upstream stream and forwarding agent text to Cartesia for synthesis.
   * All events are passed through to the downstream via the passthrough iterator.
   * This allows audio generation to begin before the agent has finished generating.
   */
  const producer = iife(async () => {
    try {
      let buffer: string[] = [];
      for await (const event of eventStream) {
        // Pass through all events to downstream consumers
        passthrough.push(event);
        // Send agent text chunks to Cartesia for synthesis
        if (event.type === "agent_chunk") {
          buffer.push(event.text);
        }
        // Send all buffered text to Cartesia for synthesis
        if (event.type === "agent_end") {
          const text = buffer.join("");
          console.log("🔊 Sending to TTS:", text);
          await tts.sendText(text);
          buffer = [];
        }
      }
    } finally {
      // Signal to Cartesia that text sending is complete
      await tts.close();
    }
  });

  /**
   * Promise that receives audio events from Cartesia.
   *
   * This runs concurrently with the producer, listening for TTS audio chunks
   * and pushing them into the passthrough iterator for downstream stages.
   */
  const consumer = iife(async () => {
    for await (const event of tts.receiveEvents()) {
      passthrough.push(event);
    }
  });

  try {
    // Yield events as they arrive from both producer (upstream) and consumer (TTS)
    yield* passthrough;
  } finally {
    // Wait for the producer and consumer to complete when cleaning up
    await Promise.all([producer, consumer]);
  }
}

app.get("/*", serveStatic({ root: STATIC_DIR }));

app.get(
  "/ws",
  upgradeWebSocket(async () => {
    let currentSocket: WSContext<WebSocket> | undefined;

    // Create a writable stream for incoming WebSocket audio data
    const inputStream = writableIterator<Uint8Array>();

    // Define the voice processing pipeline as a chain of async generators
    // Audio -> STT events
    const transcriptEventStream = sttStream(inputStream);
    // STT events -> STT Events + Agent events
    const agentEventStream = agentStream(transcriptEventStream);
    // STT events + Agent events -> STT Events + Agent Events + TTS events
    const outputEventStream = ttsStream(agentEventStream);

    const flushPromise = iife(async () => {
      // Process all events from the pipeline, sending events back to the client
      for await (const event of outputEventStream) {
        currentSocket?.send(JSON.stringify(event));
      }
    });

    return {
      onOpen(_, ws) {
        currentSocket = ws;
      },
      onMessage(event) {
        // Push incoming audio data into the pipeline's input stream
        const data = event.data;
        if (Buffer.isBuffer(data)) {
          inputStream.push(new Uint8Array(data));
        } else if (data instanceof ArrayBuffer) {
          inputStream.push(new Uint8Array(data));
        }
      },
      async onClose() {
        // Signal end of stream when socket closes
        inputStream.cancel();
        await flushPromise;
      },
    };
  })
);

const server = serve({
  fetch: app.fetch,
  port: PORT,
});

injectWebSocket(server);

console.log(`Server is running on port ${PORT}`);
