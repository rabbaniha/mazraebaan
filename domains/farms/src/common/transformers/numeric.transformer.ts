import type { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL `numeric` columns are returned by the `pg` driver as strings.
 * This transformer converts them to JS `number` on read and passes numbers
 * through on write, so entity fields can be typed `number | null`.
 *
 * Areas are bounded well within the IEEE-754 safe integer range, so the
 * string→number conversion is lossless at the precision we store (4 dp).
 */
export const numericTransformer: ValueTransformer = {
  to(value: number | null | undefined): number | null {
    return value ?? null;
  },
  from(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  },
};
