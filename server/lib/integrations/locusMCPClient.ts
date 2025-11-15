import { MCPClientCredentials } from "@locus-technologies/langchain-mcp-m2m";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

let _initialized = false;
let _client: MCPClientCredentials | null = null;
let _agent: ReturnType<typeof createReactAgent> | null = null;

function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value!;
}

// this is used by all your other agents (payments, penalty, escrow, etc)
export async function getLocusAgent() {
  if (_agent && _initialized) return _agent;

  const url = getEnv("LOCUS_MCP_URL");
  const clientId = getEnv("LOCUS_CLIENT_ID");
  const clientSecret = getEnv("LOCUS_CLIENT_SECRET");
  const anthropicKey = getEnv("ANTHROPIC_API_KEY");

  // set anthropic api key for SDK
  process.env.ANTHROPIC_API_KEY = anthropicKey;

  // 1. create MCP client with OAuth client credentials
  _client = new MCPClientCredentials({
    mcpServers: {
      "locus-server": {
        url,
        auth: {
          clientId,
          clientSecret,
        },
      },
    },
  });

  // 2. initialize connection + load tools
  await _client.initializeConnections();
  const tools = await _client.getTools();

  // 3. create LangGraph agent attached to tools
  const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
  });

  _agent = createReactAgent({
    llm,
    tools,
  });

  _initialized = true;
  return _agent;
}

// helpful for debugging
export async function getLocusTools() {
  if (!_initialized) {
    await getLocusAgent();
  }
  return _client!.getTools();
}
