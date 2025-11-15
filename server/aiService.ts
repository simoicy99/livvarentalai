import OpenAI from "openai";
import type { Listing, TenantPreferences, User } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export async function generateMatchScore(
  listing: Listing,
  tenant: User,
  preferences?: TenantPreferences
): Promise<{ score: number; reasoning: string }> {
  try {
    const prompt = `You are an AI rental matching assistant. Analyze how well this listing matches this tenant's preferences and profile.

Listing:
- Title: ${listing.title}
- Location: ${listing.city}, ${listing.state || listing.country}
- Price: $${listing.price}/month
- Bedrooms: ${listing.bedrooms}
- Bathrooms: ${listing.bathrooms}
- Property Type: ${listing.propertyType}
- Amenities: ${listing.amenities.join(", ")}
${listing.description ? `- Description: ${listing.description}` : ""}

Tenant Profile:
- Name: ${tenant.firstName} ${tenant.lastName || ""}
${preferences ? `
Preferences:
- Max Budget: $${preferences.maxPrice || "not specified"}
- Min Bedrooms: ${preferences.minBedrooms || "not specified"}
- Min Bathrooms: ${preferences.minBathrooms || "not specified"}
- Preferred Cities: ${preferences.preferredCities.length > 0 ? preferences.preferredCities.join(", ") : "not specified"}
- Property Types: ${preferences.propertyTypes.length > 0 ? preferences.propertyTypes.join(", ") : "not specified"}
- Required Amenities: ${preferences.requiredAmenities.length > 0 ? preferences.requiredAmenities.join(", ") : "not specified"}
` : ""}

Please analyze the match and respond with a JSON object containing:
1. score: A number between 0-100 indicating match quality
2. reasoning: A brief explanation of why this match score was given

Consider factors like budget compatibility, location preferences, amenity matches, and property type preferences.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      score: Math.min(100, Math.max(0, result.score || 0)),
      reasoning: result.reasoning || "Match analysis completed",
    };
  } catch (error) {
    console.error("Error generating match score:", error);
    return {
      score: 50,
      reasoning: "Unable to generate detailed match analysis",
    };
  }
}

export async function generateAutomatedResponse(
  messageContext: string,
  senderName: string,
  listing?: Listing
): Promise<string> {
  try {
    const prompt = `You are a helpful AI assistant for a rental platform. Generate a professional and friendly automated response.

Context: ${messageContext}
Sender: ${senderName}
${listing ? `Listing: ${listing.title} - $${listing.price}/month in ${listing.city}` : ""}

Generate a brief, helpful response (2-3 sentences) that acknowledges the inquiry and provides relevant information or next steps. Be warm and professional.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 8192,
    });

    return response.choices[0]?.message?.content || "Thank you for your message. We'll get back to you soon.";
  } catch (error) {
    console.error("Error generating automated response:", error);
    return "Thank you for your message. We'll get back to you soon.";
  }
}
