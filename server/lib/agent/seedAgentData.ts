import { seedDemoProfiles } from './trustScoreAgent';
import { seedDemoPenalties } from './badBehaviorAgent';
import { createVerificationCase, addUpload } from './moveInVerificationAgent';
import { createEscrowRecord } from '../services/escrowService';

export function seedAgentData(): void {
  seedDemoProfiles();
  seedDemoPenalties();

  const demoEscrow = createEscrowRecord({
    listingId: 'zillow_1',
    tenantEmail: 'demo_user@livva.com',
    amount: 3200,
    currency: 'usd',
    channel: 'locus',
    locusTransactionId: 'loc_tx_demo_12345',
  });

  const verificationCase = createVerificationCase({
    escrowId: demoEscrow.id,
    listingId: 'zillow_1',
    tenantEmail: 'demo_user@livva.com',
    landlordEmail: 'landlord@example.com',
  });

  addUpload(demoEscrow.id, {
    type: 'photo',
    url: 'https://example.com/move-in-photo1.jpg',
    uploadedBy: 'tenant',
    timestamp: new Date().toISOString(),
    description: 'Living room condition on move-in',
  });

  addUpload(demoEscrow.id, {
    type: 'photo',
    url: 'https://example.com/move-in-photo2.jpg',
    uploadedBy: 'tenant',
    timestamp: new Date().toISOString(),
    description: 'Kitchen condition on move-in',
  });

  addUpload(demoEscrow.id, {
    type: 'document',
    url: 'https://example.com/lease.pdf',
    uploadedBy: 'landlord',
    timestamp: new Date().toISOString(),
    description: 'Signed lease agreement',
  });

  console.log('Agent demo data seeded successfully');
}
