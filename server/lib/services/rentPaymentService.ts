import { nanoid } from "nanoid";

export interface RentPayment {
  id: string;
  listingId: string;
  listingTitle: string;
  landlordEmail?: string;
  landlordName?: string;
  tenantEmail: string;
  amount: number;
  currency: string;
  status: "paid" | "upcoming" | "failed" | "pending";
  paymentIntentId?: string;
  paidAt?: string;
  dueDate?: string;
  period?: string;
  createdAt: string;
  updatedAt: string;
}

// in-memory payment store for demo purposes
// in production, this would be a database table
const payments = new Map<string, RentPayment>();

interface CreatePaymentParams {
  listingId: string;
  listingTitle: string;
  landlordEmail?: string;
  landlordName?: string;
  tenantEmail: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  period?: string;
}

export function createRentPayment(params: CreatePaymentParams): RentPayment {
  const payment: RentPayment = {
    id: nanoid(),
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    landlordEmail: params.landlordEmail,
    landlordName: params.landlordName,
    tenantEmail: params.tenantEmail,
    amount: params.amount,
    currency: params.currency,
    status: "paid",
    paymentIntentId: params.paymentIntentId,
    paidAt: new Date().toISOString(),
    period: params.period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  payments.set(payment.id, payment);
  return payment;
}

export function getPaymentById(id: string): RentPayment | undefined {
  return payments.get(id);
}

export function listPaymentsForTenant(tenantEmail: string): RentPayment[] {
  return Array.from(payments.values()).filter(
    (payment) => payment.tenantEmail === tenantEmail
  );
}

export function getAllPayments(): RentPayment[] {
  return Array.from(payments.values());
}
