// Builds the launch email for every provider: outreach/emails/<id>.html (+ .txt) and outreach/recipients.csv.
// Figures come from data/outreach-figures.json (sourced). Nothing is sent by this script.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const P = JSON.parse(fs.readFileSync(path.join(root, 'src/data/providers.json'), 'utf8'));
const F = JSON.parse(fs.readFileSync(path.join(root, 'data/outreach-figures.json'), 'utf8'));
const SITE = 'https://fosteringtoday.com';
const out = path.join(root, 'outreach', 'emails');
fs.mkdirSync(out, { recursive: true });

const fig = (topic) => F.find((f) => f.topic.startsWith(topic));
const src = (f) => `<a href="${f.source.url}" style="color:#3B372F">${esc(f.source.publisher)}${f.source.date ? ', ' + f.source.date.slice(0, 4) : ''}</a>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const enq = fig('Enquiries vs newly approved carers');
const households = fig('Ofsted fostering statistics 2024-25: fostering households');
const fee = fig('IFA weekly fee paid by councils (England)');
const annual = fig('IFA average annual fee per child');
const hubSpend = fig('Marketing spend on carer recruitment');

const FEATURED_YEAR = 199 * 12; // indicative price on the packages page
const PREMIUM_PAY = JSON.parse(fs.readFileSync(path.join(root, 'src/data/payments.json'), 'utf8')).premium;
const FEATURED_PAY = JSON.parse(fs.readFileSync(path.join(root, 'src/data/payments.json'), 'utf8')).featured;
const LEGAL = 'Fostering Today is operated by Urban Carers Ltd, 3rd Floor, 45 Albemarle Street, London, England, W1S 4JL. Registered in England and Wales, company no. 15419139.';

function email(p) {
  const isCouncil = p.providerType === 'local_authority';
  const profile = `${SITE}/agency/${p.id}/`;
  const shot = `${SITE}/previews/${p.id}.jpg`;
  const claim = `${SITE}/claim/?provider=${p.id}`;
  const first = p.name.split(' (')[0];
  const hello = /fostering/i.test(first) ? `${first} team` : `${first} fostering team`;
  const subject = `${first}: your profile is live on Fostering Today. Claim it free`;
  const askUrl = `${SITE}/contact/?plan=${isCouncil ? 'council' : 'featured'}`;
  const pre = 'Your profile is already live. Claim it free to add your logo and see who is looking at it.';

  const stat = `Last year there were almost 150,000 fostering enquiries in England but only 7,365 newly approved carers (${src(enq)}). People are searching; the agencies and councils they find first are the ones they call.`;
  const statTxt = 'Last year there were almost 150,000 fostering enquiries in England but only 7,365 newly approved carers (DfE, 2026). People are searching; the agencies and councils they find first are the ones they call.';
  const font = "font-family:'DM Sans',Helvetica,Arial,sans-serif";
  const tile = (label, note) => `<td class="tile" width="50%" valign="top" style="padding:4px"><table role="presentation" width="100%" height="92" cellpadding="0" cellspacing="0" style="height:92px;background:#FBF4E6;border:2px solid #14130F;border-radius:12px"><tr><td style="padding:12px 14px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#3B372F">${label}</div><div style="font-size:14px;line-height:1.4;margin-top:4px">${note}</div></td></tr></table></td>`;
  const card = (bg, title, price, items) => `<td class="plan" width="50%" valign="top" style="padding:6px"><table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:2px solid #14130F;border-radius:14px"><tr><td style="padding:16px 18px"><div style="font-size:17px;font-weight:800">${title}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em;margin:2px 0 8px">${price}<span style="font-size:14px;font-weight:500"> a month</span></div><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5">${items.map((i) => `<li style="margin:0 0 5px">${i}</li>`).join('')}</ul></td></tr></table></td>`;

  const roi = isCouncil ? '' : `<p style="margin:0 0 14px">For an independent agency the maths is short: at the CMA's average fee of about £820 a week per child, one new placement brings in around £42,600 a year in fees (${src(annual)}). Featured costs £2,388 a year.</p>`;
  const roiTxt = isCouncil ? '' : "For an independent agency the maths is short: at the CMA's average fee of about £820 a week per child, one new placement brings in around £42,600 a year in fees (CMA, 2021). Featured costs £2,388 a year.\n\n";

  const plansHtml = isCouncil
    ? `<h2 style="font-size:20px;margin:6px 0 8px">Want to be found first in your area?</h2><p style="margin:0 0 14px">Councils can take a Featured placement: pinned first on the local page for each area you recruit in, such as “Fostering agencies in Croydon”, clearly labelled, with enquiries going straight to your team. <a href="${askUrl}" style="color:#14130F;font-weight:700">Ask us about it</a>.</p>`
    : `<h2 style="font-size:20px;margin:6px 0 8px">Want to be found first?</h2>
<p style="margin:0 0 8px">Paid placement is always labelled, never changes how details are checked, and there is no charge per lead.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px 8px;width:calc(100% + 12px)"><tr>
${card('#FFF3CC', 'Featured', '£199', ['Pinned first on the local page people search for, such as “Fostering agencies in Croydon”, in up to five areas you choose', 'Enquiry form on your profile; enquiries go to your team and your portal', 'Full portal statistics'])}
${card('#E4DCFF', 'Premium', '£799', ['Everything in Featured', 'Pinned first on the local page for every area you cover', 'Area demand report: how many people search for each of your areas, month on month', 'Named contact, same-day changes'])}
</tr></table>
<p style="margin:0 0 6px;font-size:14px">Monthly rolling, cancel any time. We don't promise enquiries; we show you the numbers. Founding partners get first choice of areas and keep the launch price for twelve months.</p>
<p style="margin:0 0 20px;font-size:15px"><a href="${FEATURED_PAY}?client_reference_id=${p.id}" style="color:#14130F;font-weight:700">Subscribe to Featured</a> &nbsp;·&nbsp; <a href="${PREMIUM_PAY}?client_reference_id=${p.id}" style="color:#14130F;font-weight:700">Subscribe to Premium</a> &nbsp;·&nbsp; <a href="${askUrl}" style="color:#14130F;font-weight:700">Ask a question first</a></p>`;
  const plansTxt = isCouncil
    ? `Want to be found first in your area? Councils can take a Featured placement: pinned first on the local page for each area you recruit in, such as “Fostering agencies in Croydon”, clearly labelled, with enquiries going straight to your team. Ask us about it: ${askUrl}`
    : `WANT TO BE FOUND FIRST?
Paid placement is always labelled, never changes how details are checked, and there is no charge per lead.

Featured, £199 a month
- Pinned first on the local page people search for, such as “Fostering agencies in Croydon”, in up to five areas you choose
- Enquiry form on your profile; enquiries go to your team and your portal
- Full portal statistics

Premium, £799 a month
- Everything in Featured
- Pinned first on the local page for every area you cover
- Area demand report: how many people search for each of your areas, month on month
- Named contact, same-day changes

Monthly rolling, cancel any time. We don't promise enquiries; we show you the numbers. Founding partners get first choice of areas and keep the launch price for twelve months.
Subscribe to Featured: ${FEATURED_PAY}?client_reference_id=${p.id}
Subscribe to Premium: ${PREMIUM_PAY}?client_reference_id=${p.id}
Ask a question first: ${askUrl}`;

  const html = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title>
<style>@media only screen and (max-width:520px){.plan,.tile{display:block!important;width:100%!important}.pad{padding-left:20px!important;padding-right:20px!important}}</style></head>
<body style="margin:0;padding:0;background:#FBF4E6;${font};color:#14130F">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#FBF4E6">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF4E6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:2px solid #14130F;border-radius:20px">
<tr><td class="pad" style="padding:24px 32px 4px"><img src="${SITE}/email-logo.png" alt="Fostering Today" width="240" height="49" style="display:block;border:0;width:240px;height:auto"></td></tr>
<tr><td class="pad" style="padding:12px 32px 0;font-size:16px;line-height:1.55">
<p style="margin:0 0 12px">Hello ${esc(hello)},</p>
<p style="margin:0 0 12px">${stat}</p>
<p style="margin:0 0 14px"><strong>Fostering Today is a new independent directory</strong> where those people compare every fostering ${isCouncil ? 'service' : 'agency'} in the UK. Your profile is already live, built from public records:</p>
</td></tr>
<tr><td class="pad" style="padding:0 32px"><a href="${profile}"><img src="${shot}" alt="Your profile on Fostering Today" width="536" style="width:100%;max-width:536px;height:auto;border:2px solid #14130F;border-radius:12px;display:block"></a></td></tr>
<tr><td class="pad" style="padding:20px 32px 0;font-size:16px;line-height:1.55">
<h2 style="font-size:22px;margin:0 0 8px;letter-spacing:-.02em">Claim it free. Get your own login.</h2>
<p style="margin:0 0 10px">Check every detail, add your logo and recruitment link, and see what happens on your profile:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -4px 14px;width:calc(100% + 8px)"><tr>${tile('Appearances', 'Each time you show up in directory results')}${tile('Profile views', 'People who open your page')}</tr><tr>${tile('Clicks', 'To your website, recruitment page and phone')}${tile('Enquiries', 'From your profile, with contact details')}</tr></table>
${roi}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr><td style="background:#FFC933;border:2px solid #14130F;border-radius:999px"><a href="${claim}" style="display:inline-block;padding:14px 26px;font-weight:700;font-size:17px;color:#14130F;text-decoration:none">Claim your free profile</a></td></tr></table>
${plansHtml}
<p style="margin:0 0 24px">Kind regards,<br>The Fostering Today team<br><a href="${SITE}" style="color:#14130F">fosteringtoday.com</a></p>
</td></tr>
<tr><td class="pad" style="padding:16px 32px 24px;border-top:1px solid #DDD6C8;font-size:12px;line-height:1.5;color:#3B372F">
${LEGAL} You are receiving this because your organisation runs a fostering service listed in public records; this is a business-to-business message, and our <a href="${SITE}/legal/privacy/" style="color:#3B372F">privacy notice</a> explains how we use your details. <a href="${SITE}/unsubscribe/?p=${p.id}" style="color:#3B372F;font-weight:bold">Unsubscribe in one click</a>.
</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Hello ${hello},

${statTxt}

Fostering Today is a new independent directory where those people compare every fostering ${isCouncil ? 'service' : 'agency'} in the UK. Your profile is already live, built from public records: ${profile}
A picture of it: ${shot}

CLAIM IT FREE. GET YOUR OWN LOGIN.
Check every detail, add your logo and recruitment link, and see what happens on your profile: appearances in directory results, profile views, clicks to your website, recruitment page and phone, and enquiries.

${roiTxt}Claim your free profile: ${claim}

${plansTxt}

Kind regards,
The Fostering Today team, ${SITE}
${LEGAL}
Business-to-business message; privacy notice: ${SITE}/legal/privacy/. Unsubscribe in one click: ${SITE}/unsubscribe/?p=${p.id}
`;
  return { subject, html, text };
}

const rows = [['id', 'name', 'nation', 'type', 'email', 'profile', 'preview', 'email_file', 'subject']];
for (const p of P) {
  const e = email(p);
  fs.writeFileSync(path.join(out, `${p.id}.html`), e.html);
  fs.writeFileSync(path.join(out, `${p.id}.txt`), e.text);
  rows.push([p.id, p.name, p.nation, p.providerType, p.publicEnquiryEmail || '', `${SITE}/agency/${p.id}/`, `${SITE}/previews/${p.id}.jpg`, `emails/${p.id}.html`, e.subject]);
}
const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
fs.writeFileSync(path.join(root, 'outreach', 'recipients.csv'), csv + '\n');
const withEmail = P.filter((p) => p.publicEnquiryEmail).length;
console.log(`Built ${P.length} emails; ${withEmail} providers have a known generic address, ${P.length - withEmail} need one found.`);
