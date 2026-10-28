export type ProviderType = 'local_authority' | 'independent_agency' | 'other';

export type Nation = 'England' | 'Scotland' | 'Wales' | 'Northern Ireland';

export type FosteringType =
  | 'short-term'
  | 'long-term'
  | 'emergency'
  | 'respite'
  | 'parent-and-child'
  | 'sibling-groups'
  | 'teenagers'
  | 'therapeutic'
  | 'other';

export interface ProviderSource {
  url: string;
  retrievedOn: string;
  supports: string[];
  /** Derived at merge time: a regulator register or the provider's own website. */
  kind: 'regulator' | 'provider-website' | 'other';
}

export interface Provider {
  id: string;
  name: string;
  providerType: ProviderType;
  nation: Nation;
  areasServed: string[];
  address: { line1: string | null; town: string | null; postcode: string | null };
  phone: string | null;
  website: string | null;
  recruitmentUrl: string | null;
  publicEnquiryEmail: string | null;
  fosteringTypes: FosteringType[];
  regulatorName: string | null;
  regulatorReference: string | null;
  sources: ProviderSource[];
  notes: string | null;
  tier: Tier;
  placementAreas: string[];
}

export interface Article {
  slug: string;
  title: string;
  standfirst: string;
  publishedOn: string;
  eventDate: string | null;
  topics: string[];
  body: string[];
  sources: { title: string; url: string; publisher: string; date: string | null }[];
}

export type Tier = 'free' | 'featured' | 'premium';

/** Paid placement, kept in data/placements.json and applied at merge time. */
export interface Placement {
  tier: Tier;
  /** Areas (as written in areasServed / towns) where the listing is highlighted. */
  areas: string[];
  /** ISO date the placement ends; expired placements are ignored. */
  until: string;
}

/** Slim record used by the directory search; keeps the directory page small. */
export interface DirectoryEntry {
  id: string;
  name: string;
  providerType: ProviderType;
  nation: Nation;
  town: string | null;
  postcode: string | null;
  areasServed: string[];
  fosteringTypes: FosteringType[];
  website: string | null;
  recruitmentUrl: string | null;
  /** Source kind backing each displayed field, if any. */
  kinds: { areasServed?: ProviderSource['kind']; fosteringTypes?: ProviderSource['kind'] };
  tier: Tier;
  placementAreas: string[];
}
