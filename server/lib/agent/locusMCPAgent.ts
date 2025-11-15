import { ChatAnthropic } from "@langchain/anthropic";
import { MCPClientCredentials } from "@locus-technologies/langchain-mcp-m2m";

if (!process.env.LOCUS_CLIENT_ID || !process.env.LOCUS_CLIENT_SECRET) {
  console.warn("Locus MCP credentials not configured");
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Anthropic API key not configured");
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
}

export async function createLocusMCPPayment(
  request: LocusPaymentRequest
): Promise<LocusPaymentResponse> {
  try {
    if (!process.env.LOCUS_CLIENT_ID || !process.env.LOCUS_CLIENT_SECRET) {
      return {
        success: false,
        error: "Locus credentials not configured",
      };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: "Anthropic API key not configured",
      };
    }

    const llm = new ChatAnthropic({
      modelName: "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const mcpClient = new MCPClientCredentials({
      clientId: process.env.LOCUS_CLIENT_ID,
      clientSecret: process.env.LOCUS_CLIENT_SECRET,
      serverUrl: "https://api.paywithlocus.com/mcp",
      llm,
    });

    const paymentPrompt = `Create a secure payment transaction with the following details:
- Amount: ${request.amount} ${request.currency}
- Description: ${request.description}
- Recipient: ${request.recipientEmail}
${request.metadata ? `- Metadata: ${JSON.stringify(request.metadata)}` : ""}

Please initiate the payment and return the transaction ID.`;

    const result = await mcpClient.invoke({ input: paymentPrompt });

    return {
      success: true,
      paymentId: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return { status: "error", details: { error: "Anthropic API key not configured" } };
    }

    const llm = new ChatAnthropic({
      modelName: "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const mcpClient = new MCPClientCredentials({
      clientId: process.env.LOCUS_CLIENT_ID!,
      clientSecret: process.env.LOCUS_CLIENT_SECRET!,
      serverUrl: "https://api.paywithlocus.com/mcp",
      llm,
    });

    const statusPrompt = `Check the status of payment transaction: ${paymentId}`;
    const result = await mcpClient.invoke({ input: statusPrompt });

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
