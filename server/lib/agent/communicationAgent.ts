import type { TenantProfile, Listing, ConversationMessage } from "../../../shared/types";
import { nanoid } from "nanoid";

// communication agent generates message templates for tenant-landlord interactions
// in the future, this would use an llm to generate personalized messages
export function generateInitialMessage(
  tenant: TenantProfile,
  listing: Listing
): ConversationMessage {
  const text = `Hi! My name is ${tenant.name} and I'm interested in your ${listing.bedrooms}-bedroom property at ${listing.address}. I'm looking to move in around ${tenant.moveInDate || "soon"} and my budget is $${tenant.budgetMin}-${tenant.budgetMax}/month. This listing at $${listing.price}/month looks like a great fit. Would it be possible to schedule a viewing? Thanks!`;

  return {
    id: nanoid(),
    role: "tenant",
    text,
    createdAt: new Date().toISOString(),
  };
}

export function generateFollowUpMessage(
  tenant: TenantProfile,
  listing: Listing,
  context?: string
): ConversationMessage {
  let text: string;

  if (context === "no_response") {
    text = `Hi again! I wanted to follow up on my inquiry about the ${listing.bedrooms}-bedroom property at ${listing.address}. I'm still very interested and would love to schedule a viewing. Please let me know your availability. Thank you!`;
  } else if (context === "viewing_confirmation") {
    text = `Thank you for getting back to me! I'm excited to view the property at ${listing.address}. Please let me know what time works best for you, and I'll make sure to be there. Looking forward to it!`;
  } else {
    text = `I wanted to check in regarding the property at ${listing.address}. I'm still very interested and would appreciate any updates you can share. Thanks!`;
  }

  return {
    id: nanoid(),
    role: "tenant",
    text,
    createdAt: new Date().toISOString(),
  };
}

// ai-powered message generation would go here
// example: using openai to analyze listing details, tenant profile, and conversation history
// to generate more personalized and contextually appropriate messages
