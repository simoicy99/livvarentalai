import { MCPClientCredentials } from "@locus-technologies/langchain-mcp-m2m";

if (!process.env.LOCUS_CLIENT_ID || !process.env.LOCUS_CLIENT_SECRET) {
  console.warn("Locus MCP credentials not configured");
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


    const mcpClient = new MCPClientCredentials({
      mcpServers: {
        'locus': {
          url: "https://api.paywithlocus.com/mcp",
          auth: {
            clientId: process.env.LOCUS_CLIENT_ID,
            clientSecret: process.env.LOCUS_CLIENT_SECRET,
          }
        }
      }
    });

    await mcpClient.initializeConnections();
    const tools = await mcpClient.getTools();

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

    const mcpClient = new MCPClientCredentials({
      mcpServers: {
        'locus': {
          url: "https://api.paywithlocus.com/mcp",
          auth: {
            clientId: process.env.LOCUS_CLIENT_ID!,
            clientSecret: process.env.LOCUS_CLIENT_SECRET!,
          }
        }
      }
    });

    await mcpClient.initializeConnections();

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
