import type { EscrowRecord, EscrowStatus, PaymentChannel } from "../../../shared/types";
import { nanoid } from "nanoid";

// in-memory escrow store for demo purposes
// in production, this would be a database table
const escrows = new Map<string, EscrowRecord>();

interface CreateEscrowParams {
  listingId: string;
  tenantEmail: string;
  amount: number;
  currency: string;
  channel: PaymentChannel;
  locusTransactionId?: string;
  locusEscrowId?: string;
  stripeSessionId?: string;
}

export function createEscrowRecord(params: CreateEscrowParams): EscrowRecord {
  const escrow: EscrowRecord = {
    id: nanoid(),
    listingId: params.listingId,
    tenantEmail: params.tenantEmail,
    channel: params.channel,
    amount: params.amount,
    currency: params.currency,
    status: "pending",
    locusTransactionId: params.locusTransactionId,
    locusEscrowId: params.locusEscrowId,
    stripeSessionId: params.stripeSessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  escrows.set(escrow.id, escrow);
  return escrow;
}

export function getEscrowById(id: string): EscrowRecord | undefined {
  return escrows.get(id);
}

export function listEscrowsForTenant(tenantEmail: string): EscrowRecord[] {
  return Array.from(escrows.values()).filter(
    (escrow) => escrow.tenantEmail === tenantEmail
  );
}

export function updateEscrowStatus(id: string, status: EscrowStatus): EscrowRecord | null {
  const escrow = escrows.get(id);
  if (!escrow) {
    return null;
  }

  escrow.status = status;
  escrow.updatedAt = new Date().toISOString();
  escrows.set(id, escrow);
  return escrow;
}

export function getAllEscrows(): EscrowRecord[] {
  return Array.from(escrows.values());
}
