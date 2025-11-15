import { recordEvent as recordTrustEvent } from './trustScoreAgent';

export interface PenaltyEvent {
  id: string;
  eventType: string;
  fromEmail: string;
  toEmail: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  transactionId?: string;
}

const penaltyEvents: PenaltyEvent[] = [];
const userPenaltyCaps = new Map<string, { daily: number; weekly: number }>();

const PENALTY_AMOUNTS: Record<string, number> = {
  TENANT_LATE_CANCEL: 10,
  TENANT_NO_SHOW: 15,
  LANDLORD_GHOST: 12,
  LANDLORD_LAST_MINUTE_CANCEL: 15,
  TENANT_DAMAGE: 25,
  LANDLORD_MISREPRESENT: 20,
  TENANT_LATE_PAYMENT: 8,
  LANDLORD_NO_SHOW: 15,
};

const DAILY_PENALTY_CAP = 50;
const WEEKLY_PENALTY_CAP = 150;

export async function applyPenalty(params: {
  eventType: string;
  fromEmail: string;
  toEmail: string;
  reason: string;
  amount?: number;
}): Promise<PenaltyEvent> {
  const { eventType, fromEmail, toEmail, reason, amount } = params;

  if (!canApplyPenalty(fromEmail)) {
    throw new Error('Penalty cap reached for this user');
  }

  const penaltyAmount = amount || PENALTY_AMOUNTS[eventType] || 5;

  const penalty: PenaltyEvent = {
    id: `penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    fromEmail,
    toEmail,
    amount: penaltyAmount,
    currency: 'USDC',
    reason,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  penaltyEvents.push(penalty);
  updatePenaltyCaps(fromEmail, penaltyAmount);

  const trustEventType = eventType.includes('TENANT') ? eventType : eventType.replace('LANDLORD', 'TENANT');
  recordTrustEvent(fromEmail, trustEventType, reason);

  try {
    penalty.status = 'completed';
    penalty.transactionId = `tx_${Date.now()}`;
  } catch (error) {
    console.error('Penalty payment failed:', error);
    penalty.status = 'failed';
  }

  return penalty;
}

function canApplyPenalty(email: string): boolean {
  const caps = userPenaltyCaps.get(email);
  if (!caps) return true;

  return caps.daily < DAILY_PENALTY_CAP && caps.weekly < WEEKLY_PENALTY_CAP;
}

function updatePenaltyCaps(email: string, amount: number): void {
  const caps = userPenaltyCaps.get(email) || { daily: 0, weekly: 0 };
  caps.daily += amount;
  caps.weekly += amount;
  userPenaltyCaps.set(email, caps);
}

export function getPenaltyEvents(email?: string): PenaltyEvent[] {
  if (email) {
    return penaltyEvents.filter(p => p.fromEmail === email || p.toEmail === email);
  }
  return penaltyEvents;
}

export function resetDailyCaps(): void {
  const entries = Array.from(userPenaltyCaps.entries());
  for (const [email, caps] of entries) {
    caps.daily = 0;
    userPenaltyCaps.set(email, caps);
  }
}

export function resetWeeklyCaps(): void {
  userPenaltyCaps.clear();
}

export function seedDemoPenalties(): void {
  applyPenalty({
    eventType: 'TENANT_LATE_CANCEL',
    fromEmail: 'badtenant@example.com',
    toEmail: 'landlord@example.com',
    reason: 'Canceled viewing 1 hour before scheduled time',
  });
  
  applyPenalty({
    eventType: 'LANDLORD_GHOST',
    fromEmail: 'ghostlandlord@example.com',
    toEmail: 'demo_user@livva.com',
    reason: 'Stopped responding after deposit was sent',
  });
}
