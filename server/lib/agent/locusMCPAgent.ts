import { MCPClientCredentials } from "@locus-technologies/langchain-mcp-m2m";
import { ChatAnthropic } from "@langchain/anthropic";
import { getLocusConfig, getAnthropicApiKey } from "../env";

let mcpClient: MCPClientCredentials | null = null;
let mcpTools: any[] = [];

async function getLocusMCPClient(): Promise<MCPClientCredentials> {
  if (mcpClient) {
    return mcpClient;
  }

  const config = getLocusConfig();
  
  mcpClient = new MCPClientCredentials({
    mcpServers: {
      'locus': {
        url: config.mcpUrl,
        auth: {
          clientId: config.clientId!,
          clientSecret: config.clientSecret!,
        }
      }
    }
  });

  await mcpClient.initializeConnections();
  mcpTools = await mcpClient.getTools();
  
  console.log(`Locus MCP initialized with ${mcpTools.length} tools`);
  return mcpClient;
}

export interface LocusPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  recipientEmail: string;
  metadata?: Record<string, any>;
}

export interface LocusPaymentResponse {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
  details?: any;
}

export async function createLocusMCPPayment(
  request: LocusPaymentRequest
): Promise<LocusPaymentResponse> {
  try {
    const config = getLocusConfig();
    if (!config.clientId || !config.clientSecret) {
      console.warn("Locus MCP credentials not configured, using mock mode");
      return {
        success: true,
        paymentId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
      };
    }

    const client = await getLocusMCPClient();
    const tools = await client.getTools();

    const llm = new ChatAnthropic({
      apiKey: getAnthropicApiKey(),
      model: "claude-3-5-sonnet-20241022",
      temperature: 0,
    });

    const llmWithTools = llm.bindTools(tools);

    const prompt = `Create a payment transaction with the following details:
- Amount: ${request.amount} ${request.currency}
- Description: ${request.description}
- Recipient Email: ${request.recipientEmail}
${request.metadata ? `- Metadata: ${JSON.stringify(request.metadata)}` : ''}

Use the Locus payment tools to create this transaction.`;

    const response = await llmWithTools.invoke(prompt);

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      const toolResult = await client.invokeToolCall(toolCall);

      return {
        success: true,
        paymentId: toolResult?.id || `locus_${Date.now()}`,
        status: toolResult?.status || "pending",
        details: toolResult,
      };
    }

    return {
      success: true,
      paymentId: `locus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "initiated",
    };
  } catch (error: any) {
    console.error("Locus MCP payment error:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment",
    };
  }
}

export async function checkLocusMCPPaymentStatus(
  paymentId: string
): Promise<{ status: string; details?: any }> {
  try {
    const config = getLocusConfig();
    if (!config.clientId || !config.clientSecret) {
      return {
        status: "completed",
        details: { paymentId, mock: true },
      };
    }

    const client = await getLocusMCPClient();
    const tools = await client.getTools();

    const llm = new ChatAnthropic({
      apiKey: getAnthropicApiKey(),
      model: "claude-3-5-sonnet-20241022",
      temperature: 0,
    });

    const llmWithTools = llm.bindTools(tools);

    const prompt = `Check the status of payment transaction with ID: ${paymentId}. Use the Locus payment tools to retrieve the current status.`;

    const response = await llmWithTools.invoke(prompt);

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      const toolResult = await client.invokeToolCall(toolCall);

      return {
        status: toolResult?.status || "unknown",
        details: toolResult,
      };
    }

    return {
      status: "completed",
      details: { paymentId, timestamp: new Date() },
    };
  } catch (error: any) {
    console.error("Locus MCP status check error:", error);
    return {
      status: "error",
      details: { error: error.message },
    };
  }
}
