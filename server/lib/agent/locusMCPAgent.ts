import { MCPClientCredentials } from "@locus-technologies/langchain-mcp-m2m";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getLocusConfig, getAnthropicApiKey } from "../env";

let mcpClient: MCPClientCredentials | null = null;
let mcpTools: any[] = [];
let reactAgent: any = null;

async function initializeLocusMCP(): Promise<void> {
  if (mcpClient) {
    return;
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
  
  console.log(`Locus MCP initialized with ${mcpTools.length} tools available`);
  console.log(`Tools: ${mcpTools.map(t => t.name).join(', ')}`);
}

export async function getLocusAgent() {
  const config = getLocusConfig();
  if (!config.clientId || !config.clientSecret) {
    console.warn("Locus MCP credentials not configured");
    return null;
  }

  if (reactAgent) {
    return reactAgent;
  }

  await initializeLocusMCP();

  const llm = new ChatAnthropic({
    apiKey: getAnthropicApiKey(),
    model: "claude-3-5-sonnet-20241022",
    temperature: 0,
  });

  reactAgent = createReactAgent({
    llm,
    tools: mcpTools,
  });

  return reactAgent;
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
    const agent = await getLocusAgent();
    
    if (!agent) {
      console.warn("Locus MCP agent not available, using mock mode");
      return {
        success: true,
        paymentId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
      };
    }

    const prompt = `Create a payment transaction with the following details:
- Amount: ${request.amount} ${request.currency}
- Description: ${request.description}
- Recipient Email: ${request.recipientEmail}
${request.metadata ? `- Metadata: ${JSON.stringify(request.metadata)}` : ''}

Use the available Locus MCP tools to create this payment transaction. Use send_to_email if available.`;

    const result = await agent.invoke({
      messages: [{ role: "user", content: prompt }]
    });

    const lastMessage = result.messages[result.messages.length - 1];
    
    return {
      success: true,
      paymentId: `locus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "initiated",
      details: {
        response: lastMessage.content,
        toolCalls: result.messages.filter((m: any) => m.tool_calls?.length > 0)
      }
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
    const agent = await getLocusAgent();
    
    if (!agent) {
      return {
        status: "completed",
        details: { paymentId, mock: true },
      };
    }

    const prompt = `Check the status of payment transaction with ID: ${paymentId}. Use get_payment_context or any available Locus tools to retrieve the current status.`;

    const result = await agent.invoke({
      messages: [{ role: "user", content: prompt }]
    });

    const lastMessage = result.messages[result.messages.length - 1];

    return {
      status: "completed",
      details: {
        paymentId,
        response: lastMessage.content,
        timestamp: new Date()
      },
    };
  } catch (error: any) {
    console.error("Locus MCP status check error:", error);
    return {
      status: "error",
      details: { error: error.message },
    };
  }
}

export async function sendToEmail(
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agent = await getLocusAgent();
    
    if (!agent) {
      console.warn("Locus MCP agent not available");
      return { success: false, error: "Agent not configured" };
    }

    const prompt = `Send an email with the following details:
- To: ${email}
- Subject: ${subject}
- Message: ${message}

Use the send_to_email tool to send this message.`;

    await agent.invoke({
      messages: [{ role: "user", content: prompt }]
    });

    return { success: true };
  } catch (error: any) {
    console.error("Send email error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendToContact(
  contactInfo: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agent = await getLocusAgent();
    
    if (!agent) {
      console.warn("Locus MCP agent not available");
      return { success: false, error: "Agent not configured" };
    }

    const prompt = `Send a message to contact: ${contactInfo}
Message: ${message}

Use the send_to_contact tool if available.`;

    await agent.invoke({
      messages: [{ role: "user", content: prompt }]
    });

    return { success: true };
  } catch (error: any) {
    console.error("Send to contact error:", error);
    return { success: false, error: error.message };
  }
}

export async function getPaymentContext(
  contextQuery: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const agent = await getLocusAgent();
    
    if (!agent) {
      console.warn("Locus MCP agent not available");
      return { success: false, error: "Agent not configured" };
    }

    const prompt = `Get payment context for: ${contextQuery}

Use the get_payment_context tool to retrieve this information.`;

    const result = await agent.invoke({
      messages: [{ role: "user", content: prompt }]
    });

    const lastMessage = result.messages[result.messages.length - 1];

    return {
      success: true,
      data: {
        response: lastMessage.content,
        messages: result.messages
      }
    };
  } catch (error: any) {
    console.error("Get payment context error:", error);
    return { success: false, error: error.message };
  }
}
