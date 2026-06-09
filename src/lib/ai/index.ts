import Anthropic from '@anthropic-ai/sdk'

const globalForAi = globalThis as unknown as { anthropic: Anthropic }

function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export const anthropic = globalForAi.anthropic ?? createAnthropicClient()

if (process.env.NODE_ENV !== 'production') globalForAi.anthropic = anthropic
