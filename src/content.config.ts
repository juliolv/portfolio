import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Work items are markdown so that `/work/[slug]` case studies can be added
 * later without touching the data model: the filename is the slug.
 */
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    order: z.number().default(99),
    name: z.string(),
    nameEs: z.string(),
    period: z.string(),
    periodEs: z.string(),
    status: z.enum(['done', 'progress', 'planned']).default('planned'),
    stack: z.array(z.string()).default([]),
    problem: z.string(),
    problemEs: z.string(),
    role: z.string(),
    roleEs: z.string(),
    outcome: z.string(),
    outcomeEs: z.string(),
  }),
});

export const collections = { work };
