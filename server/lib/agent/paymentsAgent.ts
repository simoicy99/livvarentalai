import type { EscrowRecord, PaymentChannel } from "../../../shared/types";
import { createEscrowRecord, getEscrowById, updateEscrowStatus, getAllEscrows } from "../services/escrowService";
import { createDepositSession as createLocusDeposit } from "../integrations/locus";
import { evaluateMoveIn, getVerificationCase, createVerificationCase, updateVerificationDecision } from "./moveInVerificationAgent";
import { calculateDepositMultiplier, recordEvent as recordTrustEvent } from "./trustScoreAgent";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

interface CreateDepositParams {
  listingId: string;
  tenantEmail: string;
  landlordEmail?: string;
  baseAmount: number;
  currency?: string;
  channelPreference?: PaymentChannel;
}

interface CreateDepositResult {
  escrow: EscrowRecord;
  paymentUrl?: string;
}

// payments agent handles deposit creation via locus (primary) or stripe (fallback)
export async function createDeposit(
  params: CreateDepositParams
): Promise<CreateDepositResult> {
  const currency = params.currency || "usd";
  
  const trustMultiplier = calculateDepositMultiplier(params.tenantEmail);
  const adjustedAmount = Math.round(params.baseAmount * trustMultiplier);
  
  // prefer locus if available, otherwise use stripe
  const channel: PaymentChannel = params.channelPreference || "locus";

  if (channel === "locus") {
    try {
      // create locus deposit (currently mock)
      const locusResponse = await createLocusDeposit({
        listingId: params.listingId,
        amount: adjustedAmount,
        currency,
        tenantId: params.tenantEmail,
        landlordId: params.landlordEmail || "landlord_mock",
      });

      const escrow = createEscrowRecord({
        listingId: params.listingId,
        tenantEmail: params.tenantEmail,
        amount: adjustedAmount,
        currency,
        channel: "locus",
        locusTransactionId: locusResponse.sessionId,
      });

      createVerificationCase({
        escrowId: escrow.id,
        listingId: params.listingId,
        tenantEmail: params.tenantEmail,
        landlordEmail: params.landlordEmail || "landlord_mock",
      });

      return {
        escrow,
        paymentUrl: locusResponse.checkoutUrl,
      };
    } catch (error) {
      console.error("Locus deposit failed, falling back to Stripe:", error);
      // fall through to stripe
    }
  }

  // stripe fallback
  if (!stripe) {
    throw new Error("Payment methods not configured. Please set STRIPE_SECRET_KEY or configure Locus.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Rental deposit for listing ${params.listingId}`,
          },
          unit_amount: Math.round(adjustedAmount * 100), // convert to cents
        },
        quantity: 1,
      },
    ],
    customer_email: params.tenantEmail,
    success_url: `${process.env.BASE_URL || "http://localhost:5000"}/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL || "http://localhost:5000"}/deposit/cancel`,
  });

  const escrow = createEscrowRecord({
    listingId: params.listingId,
    tenantEmail: params.tenantEmail,
    amount: adjustedAmount,
    currency,
    channel: "stripe",
    stripeSessionId: session.id,
  });

  createVerificationCase({
    escrowId: escrow.id,
    listingId: params.listingId,
    tenantEmail: params.tenantEmail,
    landlordEmail: params.landlordEmail || "landlord_mock",
  });

  return {
    escrow,
    paymentUrl: session.url || undefined,
  };
}

export async function checkDepositStatus(escrowId: string): Promise<EscrowRecord | null> {
  const escrow = getEscrowById(escrowId);
  if (!escrow) {
    return null;
  }

  // for locus, we would check the status via locus api
  // for stripe, we would check via stripe api
  // for now, just return the current status
  return escrow;
}

export async function releaseDeposit(escrowId: string): Promise<EscrowRecord | null> {
  const escrow = getEscrowById(escrowId);
  if (!escrow) {
    return null;
  }

  const verificationCase = getVerificationCase(escrowId);
  if (!verificationCase) {
    console.warn(`No verification case found for escrow ${escrowId}, releasing anyway`);
    return updateEscrowStatus(escrowId, "released");
  }

  const decision = await evaluateMoveIn({
    escrowId,
    tenantUploads: verificationCase.tenantUploads,
    landlordUploads: verificationCase.landlordUploads,
    hasDispute: verificationCase.hasDispute,
  });

  updateVerificationDecision(escrowId, decision);

  if (decision.decision === 'approve_full') {
    recordTrustEvent(escrow.tenantEmail, 'CLEAN_MOVE_IN', 'Successful move-in verification');
    const released = await updateEscrowStatus(escrowId, "released");
    return released;
  } else if (decision.decision === 'approve_partial') {
    recordTrustEvent(escrow.tenantEmail, 'PAYMENT_ON_TIME', 'Partial deposit release approved');
    const partialReleased = await updateEscrowStatus(escrowId, "partial_released");
    return partialReleased;
  } else {
    recordTrustEvent(escrow.tenantEmail, 'DISPUTE_LOST', decision.reason);
    const refunded = await updateEscrowStatus(escrowId, "refunded");
    return refunded;
  }
}

export interface ReleaseResult extends EscrowRecord {
  verificationDecision?: {
    decision: string;
    reason: string;
    confidence: number;
    partialAmount?: number;
  };
}

export async function releaseDepositWithDetails(escrowId: string): Promise<ReleaseResult | null> {
  const escrow = getEscrowById(escrowId);
  if (!escrow) {
    return null;
  }

  const verificationCase = getVerificationCase(escrowId);
  if (!verificationCase) {
    console.warn(`No verification case found for escrow ${escrowId}, releasing anyway`);
    const released = await updateEscrowStatus(escrowId, "released");
    return released;
  }

  const decision = await evaluateMoveIn({
    escrowId,
    tenantUploads: verificationCase.tenantUploads,
    landlordUploads: verificationCase.landlordUploads,
    hasDispute: verificationCase.hasDispute,
  });

  updateVerificationDecision(escrowId, decision);

  let released: EscrowRecord | null = null;

  if (decision.decision === 'approve_full') {
    recordTrustEvent(escrow.tenantEmail, 'CLEAN_MOVE_IN', 'Successful move-in verification');
    released = await updateEscrowStatus(escrowId, "released");
  } else if (decision.decision === 'approve_partial') {
    recordTrustEvent(escrow.tenantEmail, 'PAYMENT_ON_TIME', 'Partial deposit release approved');
    released = await updateEscrowStatus(escrowId, "partial_released");
  } else {
    recordTrustEvent(escrow.tenantEmail, 'DISPUTE_LOST', decision.reason);
    released = await updateEscrowStatus(escrowId, "refunded");
  }

  if (!released) return null;

  return {
    ...released,
    verificationDecision: {
      decision: decision.decision,
      reason: decision.reason,
      confidence: decision.confidence,
      partialAmount: decision.partialAmount,
    },
  };
}

export function getEscrowsByTenant(tenantEmail: string): EscrowRecord[] {
  const allEscrows = getAllEscrows();
  return allEscrows.filter(e => e.tenantEmail === tenantEmail);
}
