import { z } from 'zod';
import type { Category, Shoe } from '@/types/shoe';
import raw from './shoes.json';

const curated = z.number().int().min(1).max(5);

const shoeSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  version: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(['race', 'tempo', 'daily', 'max_cushion', 'stability', 'budget']),
  msrpUsd: z.number().positive(),
  msrpGbp: z.number().positive(),
  priceApprox: z.boolean().optional(),
  weightG: z.number().min(90).max(400),
  dropMm: z.number().min(0).max(14),
  stackHeelMm: z.number().min(20).max(60),
  stackFfMm: z.number().min(10).max(50),
  foamName: z.string().min(1),
  foamClass: z.enum(['PEBA', 'TPEE', 'TPU', 'EVA', 'BLEND']),
  plate: z.enum(['carbon', 'composite', 'none']),
  widths: z.array(z.string()).min(1),
  womensLast: z.boolean(),
  softness: curated,
  stability: curated,
  outsole: curated,
  consensus: z.string().min(10),
  athleteNotes: z.string().optional(),
  sources: z.array(z.string().url()).min(1),
  status: z.enum(['current', 'superseded', 'upcoming']),
  releaseYear: z.number().int().min(2023).max(2027),
  specEstimated: z.boolean().optional(),
  forefootShape: z.enum(['narrow', 'standard', 'roomy']).optional(),
});

export const SHOES: Shoe[] = z.array(shoeSchema).parse(raw) as Shoe[];

export const bySlug = new Map(SHOES.map((s) => [s.slug, s]));

export const BRANDS = [...new Set(SHOES.map((s) => s.brand))].sort();

export function categoryMedianGbp(cat: Category): number {
  const p = SHOES.filter((s) => s.category === cat)
    .map((s) => s.msrpGbp)
    .sort((a, b) => a - b);
  return p.length % 2 ? p[(p.length - 1) / 2] : (p[p.length / 2 - 1] + p[p.length / 2]) / 2;
}
