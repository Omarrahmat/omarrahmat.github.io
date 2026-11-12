import raw from '@/data/council-allowances.json';
import { slugify } from '@/lib/areas';

export type AllowanceRow = { label: string; weekly: number; note: string | null };
export type CouncilAllowance = {
  slug: string; council: string; nation: string; year: string; retrievedOn: string; sourceUrl: string; sourceTitle: string;
  allowances: AllowanceRow[]; fees: AllowanceRow[]; feesNote: string | null; extras: string[]; summary: string; areaNames: string[];
};

export const councilAllowances = raw as CouncilAllowance[];

export const getAllowance = (slug: string) => councilAllowances.find((c) => c.slug === slug);

/** Allowance records whose areaNames include this directory area (matched by slug). */
export function allowancesForArea(areaName: string): CouncilAllowance[] {
  const k = slugify(areaName);
  return councilAllowances.filter((c) => c.areaNames.some((n) => slugify(n) === k));
}

/** National minimum weekly allowance ranges for 2026-27 (see the calculator for the full bands and sources). */
export const NATION_MINIMUM: Record<string, string> = {
  England: '£176 to £309 a week depending on the child’s age and the region (GOV.UK, 2026-27)',
  Scotland: '£177.68 to £283.35 a week depending on age (Scottish Recommended Allowance, 2026-27)',
  Wales: '£208 to £260 a week depending on age (Foster Wales, 2026-27)',
  'Northern Ireland': '£149 to £219 a week depending on age (nidirect scale)',
};

export const gbp = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

import noScaleRaw from '@/data/council-noscale.json';

/** A council that publishes no usable current scale (written by scripts/merge-allowances.mjs from _not-published.txt). */
export type NoScaleCouncil = {
  slug: string; place: string; formal: string; providerId: string; providerName: string; nation: 'England' | 'Scotland' | 'Wales';
  checked: string; website: string | null; phone: string | null; areaNames: string[];
};
export const noScaleCouncils = noScaleRaw as NoScaleCouncil[];
export const getNoScale = (slug: string) => noScaleCouncils.find((c) => c.slug === slug);

/**
 * Minimum weekly allowances for 2026-27 by age, as a table. The same figures the pay calculator uses
 * (src/components/PayCalculator.tsx, BANDS); change both together. England: GOV.UK, 6 April 2026 to 5 April 2027.
 * Scotland: Scottish Recommended Allowance 2026-27. Wales: national minimum allowance 2026-27 (Foster Wales).
 */
export const MINIMUM_TABLE: Record<'England' | 'Scotland' | 'Wales', { columns: string[]; rows: { label: string; values: number[] }[]; source: string }> = {
  England: {
    columns: ['London', 'South East', 'Rest of England'],
    rows: [
      { label: '0 to 2', values: [205, 195, 176] },
      { label: '3 to 4', values: [208, 203, 182] },
      { label: '5 to 10', values: [233, 223, 201] },
      { label: '11 to 15', values: [266, 255, 227] },
      { label: '16 to 17', values: [309, 298, 267] },
    ],
    source: 'England minimum allowances for 6 April 2026 to 5 April 2027 (GOV.UK)',
  },
  Scotland: {
    columns: ['Scotland'],
    rows: [
      { label: '0 to 4', values: [177.68] },
      { label: '5 to 10', values: [206.71] },
      { label: '11 to 15', values: [206.71] },
      { label: '16 to 17', values: [283.35] },
    ],
    source: 'Scottish Recommended Allowance for 2026-27 (Scottish Government)',
  },
  Wales: {
    columns: ['Wales'],
    rows: [
      { label: '0 to 4', values: [229] },
      { label: '5 to 10', values: [208] },
      { label: '11 to 15', values: [208] },
      { label: '16 to 17', values: [260] },
    ],
    source: 'National minimum allowance for 2026-27 as published by Foster Wales',
  },
};
