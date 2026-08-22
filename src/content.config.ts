import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    location: z.string().min(1),
    area: z.string().min(1),
    excerpt: z.string().min(1),
    description: z.string().min(1),
    coverImage: imageSchema,
    gallery: z.array(imageSchema).min(1),
    youtubeUrl: z.union([z.string().url(), z.literal("")]).optional(),
    year: z.number().int().optional(),
    category: z.string().optional(),
    software: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects };

