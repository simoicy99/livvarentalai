export interface TrustEvent {
  email: string;
  type: string;
  delta: number;
  reason: string;
  timestamp: string;
}

export interface TrustProfile {
  email: string;
  score: number;
  events: TrustEvent[];
  verifiedIdentity: boolean;
  verifiedPhone: boolean;
  verifiedEmail: boolean;
  accountAge: number;
  lastUpdated: string;
}

const trustProfiles = new Map<string, TrustProfile>();

const EVENT_SCORE_DELTAS: Record<string, number> = {
  FAST_REPLY: 2,
  CLEAN_MOVE_IN: 5,
  VERIFIED_IDENTITY: 10,
  PAYMENT_ON_TIME: 3,
  on_time_rent_payment: 10,
  POSITIVE_REVIEW: 4,
  LATE_CANCEL: -8,
  NO_SHOW: -15,
  DISPUTE_LOST: -10,
  PAYMENT_LATE: -5,
  NEGATIVE_REVIEW: -6,
  GHOST: -12,
  VERIFIED_PHONE: 3,
  VERIFIED_EMAIL: 2,
};

export function initializeTrustProfile(email: string): TrustProfile {
  if (trustProfiles.has(email)) {
    return trustProfiles.get(email)!;
  }

  const profile: TrustProfile = {
    email,
    score: 50,
    events: [],
    verifiedIdentity: false,
    verifiedPhone: false,
    verifiedEmail: false,
    accountAge: 0,
    lastUpdated: new Date().toISOString(),
  };

  trustProfiles.set(email, profile);
  return profile;
}

export function recordEvent(params: { userId: string; eventType: string; metadata?: any }): TrustProfile;
export function recordEvent(email: string, eventType: string, reason?: string): TrustProfile;
export function recordEvent(
  emailOrParams: string | { userId: string; eventType: string; metadata?: any },
  eventType?: string,
  reason?: string
): TrustProfile {
  let email: string;
  let type: string;
  let eventReason: string;

  if (typeof emailOrParams === 'string') {
    email = emailOrParams;
    type = eventType!;
    eventReason = reason || `Event: ${type}`;
  } else {
    email = emailOrParams.userId;
    type = emailOrParams.eventType;
    eventReason = emailOrParams.metadata 
      ? `${type} - ${JSON.stringify(emailOrParams.metadata)}`
      : `Event: ${type}`;
  }

  const profile = initializeTrustProfile(email);
  const delta = EVENT_SCORE_DELTAS[type] || 0;

  const event: TrustEvent = {
    email,
    type,
    delta,
    reason: eventReason,
    timestamp: new Date().toISOString(),
  };

  profile.events.push(event);
  profile.score = Math.max(0, Math.min(100, profile.score + delta));
  profile.lastUpdated = new Date().toISOString();

  if (type === 'VERIFIED_IDENTITY') profile.verifiedIdentity = true;
  if (type === 'VERIFIED_PHONE') profile.verifiedPhone = true;
  if (type === 'VERIFIED_EMAIL') profile.verifiedEmail = true;

  trustProfiles.set(email, profile);
  return profile;
}

export function getTrustScore(email: string): number {
  const profile = trustProfiles.get(email);
  return profile ? profile.score : 50;
}

export function getTrustProfile(email: string): TrustProfile {
  return initializeTrustProfile(email);
}

export function calculateDepositMultiplier(email: string): number {
  const score = getTrustScore(email);
  
  if (score >= 80) return 0.8;
  if (score >= 60) return 1.0;
  if (score >= 40) return 1.2;
  if (score >= 20) return 1.5;
  return 1.8;
}

export function getAllTrustProfiles(): TrustProfile[] {
  return Array.from(trustProfiles.values());
}

export function seedDemoProfiles(): void {
  recordEvent('demo_user@livva.com', 'VERIFIED_EMAIL', 'Email verified during signup');
  recordEvent('demo_user@livva.com', 'VERIFIED_PHONE', 'Phone verified via SMS');
  recordEvent('demo_user@livva.com', 'FAST_REPLY', 'Responded to landlord within 2 hours');
  recordEvent('demo_user@livva.com', 'PAYMENT_ON_TIME', 'First deposit paid on time');
  
  recordEvent('landlord@example.com', 'VERIFIED_IDENTITY', 'ID verified');
  recordEvent('landlord@example.com', 'VERIFIED_EMAIL', 'Email verified');
  recordEvent('landlord@example.com', 'CLEAN_MOVE_IN', 'Smooth move-in process');
}
