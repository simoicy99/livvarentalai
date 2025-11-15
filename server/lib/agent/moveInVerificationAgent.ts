export interface VerificationUpload {
  type: 'photo' | 'document' | 'meter_reading';
  url: string;
  uploadedBy: 'tenant' | 'landlord';
  timestamp: string;
  description?: string;
}

export interface VerificationDecision {
  decision: 'approve_full' | 'approve_partial' | 'reject';
  reason: string;
  partialAmount?: number;
  confidence: number;
}

export interface VerificationCase {
  escrowId: string;
  listingId: string;
  tenantEmail: string;
  landlordEmail: string;
  tenantUploads: VerificationUpload[];
  landlordUploads: VerificationUpload[];
  hasDispute: boolean;
  status: 'pending' | 'approved' | 'rejected';
  decision?: VerificationDecision;
  createdAt: string;
}

const verificationCases = new Map<string, VerificationCase>();

export async function evaluateMoveIn(params: {
  escrowId: string;
  tenantUploads: VerificationUpload[];
  landlordUploads: VerificationUpload[];
  hasDispute: boolean;
}): Promise<VerificationDecision> {
  const { escrowId, tenantUploads, landlordUploads, hasDispute } = params;

  let score = 50;

  if (tenantUploads.length >= 3) score += 15;
  if (landlordUploads.length >= 2) score += 15;

  const hasPhotoEvidence = tenantUploads.some(u => u.type === 'photo');
  const hasLease = landlordUploads.some(u => u.type === 'document');
  
  if (hasPhotoEvidence) score += 10;
  if (hasLease) score += 10;

  if (hasDispute) score -= 30;

  const totalUploads = tenantUploads.length + landlordUploads.length;
  if (totalUploads < 2) {
    return {
      decision: 'reject',
      reason: 'Insufficient documentation provided by both parties. Need at least 2 uploads total.',
      confidence: 0.9,
    };
  }

  if (hasDispute && score < 40) {
    return {
      decision: 'reject',
      reason: 'Active dispute with insufficient supporting documentation to resolve.',
      confidence: 0.85,
    };
  }

  if (score >= 70) {
    return {
      decision: 'approve_full',
      reason: 'Complete documentation provided. Move-in condition verified by both parties.',
      confidence: score / 100,
    };
  }

  if (score >= 50) {
    const partialPercent = 0.7 + (score - 50) / 100;
    return {
      decision: 'approve_partial',
      partialAmount: partialPercent,
      reason: 'Documentation partially complete. Releasing majority of deposit with holdback for verification.',
      confidence: score / 100,
    };
  }

  return {
    decision: 'reject',
    reason: 'Documentation quality insufficient for deposit release. Please provide additional evidence.',
    confidence: 0.75,
  };
}

export function createVerificationCase(params: {
  escrowId: string;
  listingId: string;
  tenantEmail: string;
  landlordEmail: string;
}): VerificationCase {
  const verificationCase: VerificationCase = {
    ...params,
    tenantUploads: [],
    landlordUploads: [],
    hasDispute: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  verificationCases.set(params.escrowId, verificationCase);
  return verificationCase;
}

export function addUpload(escrowId: string, upload: VerificationUpload): void {
  const verificationCase = verificationCases.get(escrowId);
  if (!verificationCase) {
    throw new Error(`Verification case not found: ${escrowId}`);
  }

  if (upload.uploadedBy === 'tenant') {
    verificationCase.tenantUploads.push(upload);
  } else {
    verificationCase.landlordUploads.push(upload);
  }
}

export function getVerificationCase(escrowId: string): VerificationCase | undefined {
  return verificationCases.get(escrowId);
}

export function getAllVerificationCases(): VerificationCase[] {
  return Array.from(verificationCases.values());
}
