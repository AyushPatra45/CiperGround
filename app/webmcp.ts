'use client';
import { useEffect } from 'react';
import type { ArenaState } from '@/lib/contracts';
import { api } from '@/lib/client';
type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: object;
  execute: (input: unknown) => Promise<unknown>;
};
type ModelContext = {
  registerTool: (
    tool: ToolDefinition,
    options: { signal: AbortSignal },
  ) => unknown;
};
export function useArenaTools(refresh: () => Promise<void>) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      {
        name: 'list_ctf_challenges',
        title: 'List CTF challenges',
        description:
          'Read available challenges and your saved solve status. Does not reveal flags or locked hints.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: async (input: unknown) => {
          if (
            !input ||
            typeof input !== 'object' ||
            Array.isArray(input) ||
            Object.keys(input).length
          )
            throw new Error('Expected an empty object');
          const state = await api<ArenaState>('state');
          return { challenges: state.challenges, points: state.points };
        },
      },
      {
        name: 'submit_ctf_flag',
        title: 'Submit a CTF flag',
        description:
          'Submit a flag for the signed-in player or team. Records an attempt and awards points if correct. Subject to the same rate limits as the website.',
        inputSchema: {
          type: 'object',
          properties: {
            challengeId: { type: 'string' },
            flag: { type: 'string' },
          },
          required: ['challengeId', 'flag'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (input: unknown) => {
          if (
            !input ||
            typeof input !== 'object' ||
            Array.isArray(input) ||
            !('challengeId' in input) ||
            !('flag' in input) ||
            typeof input.challengeId !== 'string' ||
            !/^[a-z0-9-]{3,64}$/.test(input.challengeId) ||
            typeof input.flag !== 'string' ||
            input.flag.length > 256 ||
            Object.keys(input).some((k) => !['challengeId', 'flag'].includes(k))
          )
            throw new Error('Invalid challenge ID or flag');
          const result = await api(
            'challenges/' + input.challengeId + '/submit',
            { flag: input.flag },
          );
          await refresh();
          return result;
        },
      },
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, [refresh]);
}
