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
