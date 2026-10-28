import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord, sourceKind } from './lib/validate.mjs';

const good = () => ({
  id: 'example-council-fostering',
  name: 'Example Council Fostering Service',
  providerType: 'local_authority',
  nation: 'Wales',
  areasServed: ['Example'],
  address: { line1: '1 High Street', town: 'Example', postcode: 'CF10 1AA' },
  phone: '029 2000 0000',
  website: 'https://www.example.gov.wales/fostering',
  recruitmentUrl: null,
  publicEnquiryEmail: 'fostering@example.gov.wales',
  fosteringTypes: ['short-term', 'long-term'],
  regulatorName: 'Care Inspectorate Wales',
  regulatorReference: null,
  sources: [{ url: 'https://www.example.gov.wales/fostering', retrievedOn: '2026-10-27', supports: ['name'] }],
  notes: null,
});

test('accepts a well-formed record and normalises the phone number', () => {
  const res = validateRecord(good());
  assert.equal(res.ok, true);
  assert.equal(res.record.phone, '02920000000');
});

test('rejects a record with no source', () => {
  const r = good();
  r.sources = [];
  assert.equal(validateRecord(r).ok, false);
});

test('rejects a non-https website', () => {
  const r = good();
  r.website = 'http://example.org';
  assert.equal(validateRecord(r).ok, false);
});

test('removes a personal email address but keeps the record', () => {
  const r = good();
  r.publicEnquiryEmail = 'jane.smith@example.gov.wales';
  const res = validateRecord(r);
  assert.equal(res.ok, true);
  assert.equal(res.record.publicEnquiryEmail, null);
});

test('removes an invalid postcode and unknown fostering types', () => {
  const r = good();
  r.address.postcode = 'NOT A POSTCODE';
  r.fosteringTypes = ['short-term', 'made-up'];
  const res = validateRecord(r);
  assert.equal(res.record.address.postcode, null);
  assert.deepEqual(res.record.fosteringTypes, ['short-term']);
});

test('classifies source kinds', () => {
  assert.equal(sourceKind('https://careinspectorate.wales/providers', 'https://x.org'), 'regulator');
  assert.equal(sourceKind('https://www.x.org/fostering', 'https://x.org'), 'provider-website');
  assert.equal(sourceKind('https://directory.example.com/x', 'https://x.org'), 'other');
});

test('keeps service mailboxes and drops personal ones', () => {
  const mk = (e) => validateRecord({ ...good(), publicEnquiryEmail: e }).record.publicEnquiryEmail;
  assert.equal(mk('fosteringduty@example.gov.uk'), 'fosteringduty@example.gov.uk');
  assert.equal(mk('adfos-enquiry@example.gov.uk'), 'adfos-enquiry@example.gov.uk');
  assert.equal(mk('fostering.adoption@example.gov.uk'), 'fostering.adoption@example.gov.uk');
  assert.equal(mk('john.foster@example.org'), null);
  assert.equal(mk('jsmith@example.org'), null);
});

test('council and tender pages are not regulator sources', () => {
  assert.equal(sourceKind('https://www.leeds.gov.uk/fostering', 'https://www.leeds.gov.uk'), 'provider-website');
  assert.equal(sourceKind('https://www.find-tender.service.gov.uk/Notice/1', 'https://example.org'), 'other');
  assert.equal(sourceKind('https://reports.ofsted.gov.uk/provider/4/123', 'https://example.org'), 'regulator');
});

test('drops mobile numbers', () => {
  assert.equal(validateRecord({ ...good(), phone: '07700 900123' }).record.phone, null);
});

test('keeps a mailbox named after the organisation', () => {
  const r = { ...good(), name: 'New Routes Fostering', publicEnquiryEmail: 'newroutes@example.org' };
  assert.equal(validateRecord(r).record.publicEnquiryEmail, 'newroutes@example.org');
});
