export function getLocusApiKey(): string | undefined {
  return process.env.LOCUS_API_KEY;
}

export function getZillowApiKey(): string | undefined {
  return process.env.ZILLOW_API_KEY;
}

export function getApartmentsApiKey(): string | undefined {
  return process.env.APARTMENTS_API_KEY;
}

export function getLivvaInternalApiKey(): string | undefined {
  return process.env.LIVVA_INTERNAL_API_KEY;
}
