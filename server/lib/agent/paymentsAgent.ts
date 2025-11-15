import type { EscrowRecord, PaymentChannel } from "../../../shared/types";
import { createEscrowRecord, getEscrowById, updateEscrowStatus } from "../services/escrowService";
import { createDepositSession as createLocusDeposit } from "../integrations/locus";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

interface CreateDepositParams {
  listingId: string;
  tenantEmail: string;
  amount: number;
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
  
  // prefer locus if available, otherwise use stripe
  const channel: PaymentChannel = params.channelPreference || "locus";

  if (channel === "locus") {
    try {
      // create locus deposit (currently mock)
      const locusResponse = await createLocusDeposit({
        listingId: params.listingId,
        amount: params.amount,
        currency,
        tenantId: params.tenantEmail,
        landlordId: "landlord_mock",
      });

      const escrow = createEscrowRecord({
        listingId: params.listingId,
        tenantEmail: params.tenantEmail,
        amount: params.amount,
        currency,
        channel: "locus",
        locusTransactionId: locusResponse.sessionId,
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
    throw new Error("No payment method configured");
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
          unit_amount: Math.round(params.amount * 100), // convert to cents
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
    amount: params.amount,
    currency,
    channel: "stripe",
    stripeSessionId: session.id,
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

  // in production, this would call locus or stripe apis to release funds
  // for now, just update status to released
  return updateEscrowStatus(escrowId, "released");
}
