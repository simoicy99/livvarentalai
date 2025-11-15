export function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`missing required env var: ${name}`);
  }
  return value;
}

export function getLocusConfig() {
  return {
    mcpUrl: getEnv('LOCUS_MCP_URL', false) || 'https://mcp.paywithlocus.com/mcp',
    clientId: getEnv('LOCUS_CLIENT_ID', false),
    clientSecret: getEnv('LOCUS_CLIENT_SECRET', false),
  };
}

export function getAnthropicApiKey(): string {
  return getEnv('ANTHROPIC_API_KEY')!;
}
