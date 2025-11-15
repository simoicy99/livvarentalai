import type { CreateDepositParams, CreateDepositResponse } from "../../../shared/types";
import { getLocusApiKey } from "../config/env";

export async function createDepositSession(
  params: CreateDepositParams
): Promise<CreateDepositResponse> {
  const apiKey = getLocusApiKey();
  
  if (!apiKey) {
    console.warn('[Locus Mock] No LOCUS_API_KEY configured. Using mock mode.');
  }
  
  const sessionId = `loc_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const checkoutUrl = `https://paywithlocus.com/checkout/${sessionId}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  console.log(`[Locus Mock] Creating deposit session for listing ${params.listingId}`);
  console.log(`[Locus Mock] Amount: ${params.amount} ${params.currency.toUpperCase()}`);
  console.log(`[Locus Mock] API Key present: ${apiKey ? 'Yes' : 'No (using mock)'}`);

  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    sessionId,
    checkoutUrl,
    expiresAt,
  };
}
