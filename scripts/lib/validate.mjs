// Validation for provider records compiled from public sources.
// A record that fails is rejected; fields that fail are removed and reported.

export const PROVIDER_TYPES = ['local_authority', 'independent_agency', 'other'];
export const NATIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
export const FOSTERING_TYPES = [
  'short-term', 'long-term', 'emergency', 'respite', 'parent-and-child',
  'sibling-groups', 'teenagers', 'therapeutic', 'other',
];

// Regulators' own registers and reports. Council and government sites are not
// regulators, so a bare gov.uk host does not count.
const REGULATOR_HOSTS = [
  'careinspectorate.wales', 'careinspectorate.com', 'rqia.org.uk', 'ofsted.gov.uk',
];

// Only generic organisation mailboxes may be stored, never personal addresses.
// A local part is generic when it is built from service words like these.
const GENERIC_EMAIL_WORDS = [
  'info', 'enquir', 'foster', 'adopt', 'recruit', 'hello', 'contact', 'admin', 'office',
  'team', 'duty', 'placement', 'family', 'families', 'care', 'referral', 'children', 'service', 'region',
];
const STRONG_EMAIL_WORDS = ['enquir', 'duty', 'recruit', 'info', 'team', 'service', 'placement', 'referral', 'office', 'admin', 'contact', 'hello'];
const PERSONAL_EMAIL_RE = /^([a-z]+)[._-]([a-z]+)$/; // first.last style

function isGenericMailbox(local, orgName = '') {
  const hasWord = (t) => GENERIC_EMAIL_WORDS.some((w) => t.includes(w));
  // A mailbox named after the organisation itself (newroutes@…) is generic.
  const letters = (t) => t.toLowerCase().replace(/[^a-z]/g, '');
  if (letters(local).length >= 5 && letters(orgName).includes(letters(local))) return true;
  if (!hasWord(local)) return false;
  const m = PERSONAL_EMAIL_RE.exec(local);
  if (!m) return true;
  // "john.foster" is a person; "fostering.adoption" or "adfos-enquiry" is a mailbox.
  return (hasWord(m[1]) && hasWord(m[2])) || STRONG_EMAIL_WORDS.some((w) => local.includes(w));
}

const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
const PHONE_RE = /^(\+44|0)\d{9,10}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

function isHttps(url) {
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
}

function hostMatches(host, suffix) {
  return host === suffix || host.endsWith('.' + suffix);
}

export function sourceKind(sourceUrl, websiteUrl) {
  const host = hostOf(sourceUrl);
  if (!host) return 'other';
  if (REGULATOR_HOSTS.some((h) => hostMatches(host, h))) return 'regulator';
  const own = websiteUrl ? hostOf(websiteUrl) : null;
  if (own && (host === own || host.endsWith('.' + own) || own.endsWith('.' + host))) return 'provider-website';
  return 'other';
}

export function validateRecord(raw) {
  const errors = [];
  const warnings = [];
  const r = raw && typeof raw === 'object' ? raw : {};

  if (typeof r.id !== 'string' || !SLUG_RE.test(r.id)) errors.push('id must be a kebab-case slug');
  if (typeof r.name !== 'string' || r.name.trim().length < 3) errors.push('name is required');
  if (!PROVIDER_TYPES.includes(r.providerType)) errors.push('providerType is invalid');
  if (!NATIONS.includes(r.nation)) errors.push('nation is invalid');
  if (r.website != null && (typeof r.website !== 'string' || !isHttps(r.website))) errors.push('website must be an https URL or null');

  const sources = Array.isArray(r.sources) ? r.sources : [];
  const cleanSources = [];
  for (const s of sources) {
    if (s && isHttps(s.url) && DATE_RE.test(String(s.retrievedOn || ''))) {
      cleanSources.push({
        url: s.url,
        retrievedOn: s.retrievedOn,
        supports: Array.isArray(s.supports) ? s.supports.filter((x) => typeof x === 'string') : [],
        kind: sourceKind(s.url, r.website),
      });
    } else {
      warnings.push('dropped an invalid source entry');
    }
  }
  if (cleanSources.length === 0) errors.push('at least one valid source is required');

  if (errors.length) return { ok: false, errors, warnings, record: null };

  const addr = r.address && typeof r.address === 'object' ? r.address : {};
  let postcode = typeof addr.postcode === 'string' ? addr.postcode.trim().toUpperCase() : null;
  if (postcode && !POSTCODE_RE.test(postcode)) { warnings.push(`invalid postcode removed: ${postcode}`); postcode = null; }

  let phone = typeof r.phone === 'string' ? r.phone.replace(/[\s()-]/g, '') : null;
  if (phone && !PHONE_RE.test(phone)) { warnings.push(`invalid phone removed: ${r.phone}`); phone = null; }
  // A mobile number is usually an individual's, even when a regulator lists it for the organisation.
  if (phone && /^(\+447|07)/.test(phone)) { warnings.push('mobile number removed'); phone = null; }

  let email = typeof r.publicEnquiryEmail === 'string' ? r.publicEnquiryEmail.trim().toLowerCase() : null;
  if (email) {
    const local = email.split('@')[0] || '';
    if (!email.includes('@') || !isGenericMailbox(local, r.name)) {
      warnings.push(`non-generic email removed: ${local}@…`);
      email = null;
    }
  }

  let recruitmentUrl = typeof r.recruitmentUrl === 'string' && isHttps(r.recruitmentUrl) ? r.recruitmentUrl : null;
  if (r.recruitmentUrl && !recruitmentUrl) warnings.push('invalid recruitmentUrl removed');

  const types = Array.isArray(r.fosteringTypes) ? r.fosteringTypes : [];
  const fosteringTypes = types.filter((t) => FOSTERING_TYPES.includes(t));
  if (fosteringTypes.length !== types.length) warnings.push('unknown fostering types removed');

  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

  return {
    ok: true,
    errors,
    warnings,
    record: {
      id: r.id,
      name: r.name.trim(),
      providerType: r.providerType,
      nation: r.nation,
      areasServed: Array.isArray(r.areasServed) ? r.areasServed.filter((a) => typeof a === 'string' && a.trim()).map((a) => a.trim()) : [],
      address: { line1: str(addr.line1), town: str(addr.town), postcode },
      phone,
      website: r.website ?? null,
      recruitmentUrl,
      publicEnquiryEmail: email,
      fosteringTypes,
      regulatorName: str(r.regulatorName),
      regulatorReference: str(r.regulatorReference),
      sources: cleanSources,
      notes: str(r.notes),
    },
  };
}
