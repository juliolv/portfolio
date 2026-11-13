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

/**
 * Long-form case-study bodies, one file per language, joined to a work item by
 * `slug`. Kept out of the `work` collection so the card metadata stays small
 * and each language's body is a real markdown document.
 */
const workBodies = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/workBodies',
    // Without this the loader keys on the basename, so en/x.md and es/x.md
    // collapse onto one id and one language silently disappears.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    slug: z.string(),
    lang: z.enum(['en', 'es']),
  }),
});

export const collections = { work, workBodies };
