import { Context } from 'hono';
import type { Env } from '../index';

const TOOL_HANDLERS: Record<string, (c: Context<{ Bindings: Env }>) => Promise<Response>> = {
  'yield_agent.run': yieldAgentHandler,
  'swap_agent.optimized': swapAgentHandler,
  'tx_explain.deep': txExplainHandler,
};

export async function toolHandler(c: Context<{ Bindings: Env }>) {
  const toolName = c.req.param('toolName');
  const handler = TOOL_HANDLERS[toolName];

  if (!handler) {
    return c.json({ error: `Unknown tool: ${toolName}` }, 404);
  }

  return handler(c);
}

async function yieldAgentHandler(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();

  return c.json({
    tool: 'yield_agent.run',
    result: {
      recommendation: 'deposit',
      suggestedAmount: body.amount || '0.1',
      currentApy: '5.00%',
      projectedYield30d: '0.00041 SOL',
      riskLevel: 'low',
      notes: 'This is a simulated yield vault for demonstration purposes.',
    },
  });
}

async function swapAgentHandler(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();

  return c.json({
    tool: 'swap_agent.optimized',
    result: {
      recommendedRoute: 'Jupiter Direct',
      expectedOutput: body.expectedOutput || '0.0',
      priceImpact: '0.01%',
      slippage: '0.5%',
      alternativeRoutes: [
        { name: 'Raydium', output: body.expectedOutput, priceImpact: '0.02%' },
      ],
      analysis: 'The direct Jupiter route provides the best execution for this trade size.',
    },
  });
}

async function txExplainHandler(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();

  return c.json({
    tool: 'tx_explain.deep',
    result: {
      signature: body.signature,
      summary: 'Token swap transaction via Jupiter aggregator',
      tokenChanges: [
        { token: 'SOL', change: '-0.1', direction: 'out' },
        { token: 'USDC', change: '+15.50', direction: 'in' },
      ],
      programsInvolved: ['Jupiter V6', 'Token Program'],
      riskAssessment: 'low',
      gasUsed: '0.000005 SOL',
      notes: 'Standard swap transaction with no unusual activity detected.',
    },
  });
}
