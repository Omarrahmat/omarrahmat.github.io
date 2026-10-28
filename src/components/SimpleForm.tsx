'use client';

import { useState } from 'react';
import { submitForm } from '@/lib/submit';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'datalist';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  defaultValue?: string;
}

interface Props {
  idPrefix: string;
  table: string;
  fields: FieldDef[];
  /** Plain text shown next to the consent box and stored with the submission. */
  consentText: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  extra?: Record<string, string>;
}

export default function SimpleForm({ idPrefix, table, fields, consentText, submitLabel, successTitle, successBody, extra }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [mode, setMode] = useState<'live' | 'demo'>('demo');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (String(fd.get('company_site') || '')) { setState('done'); return; } // honeypot
    if (fd.get('consent') !== 'on') { setError('Please tick the box to continue.'); setState('error'); return; }
    const payload: Record<string, unknown> = { ...extra };
    for (const f of fields) payload[f.name] = String(fd.get(f.name) ?? '').trim();
    payload.consent_given = true;
    payload.consent_text = consentText;
    setState('sending');
    setError('');
    try {
      const res = await submitForm(table, payload);
      setMode(res.mode);
      setState('done');
    } catch {
      setError('Something went wrong and your message was not sent. Please try again.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="notice notice-ok" role="status">
        <h3 style={{ fontSize: 24 }}>{successTitle}</h3>
        <p style={{ marginTop: 8 }}>{successBody}</p>
        {mode === 'demo' && (
          <p style={{ marginTop: 10, fontWeight: 700 }}>
            Demo mode: this form is not connected to a database yet, so nothing was actually sent.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-stack" noValidate={false}>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const common = { id, name: f.name, required: f.required, placeholder: f.placeholder, defaultValue: f.defaultValue };
        return (
          <div className="field" key={f.name}>
            <label htmlFor={id}>{f.label}{f.required ? '' : ' (optional)'}</label>
            {f.type === 'textarea' ? (
              <textarea className="textarea" {...common} />
            ) : f.type === 'select' ? (
              <select key={f.defaultValue ?? ''} className="select" id={id} name={f.name} required={f.required} defaultValue={f.defaultValue ?? ''}>
                <option value="" disabled>Choose one</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'datalist' ? (
              <>
                <input className="input" {...common} list={`${id}-list`} autoComplete="off" />
                <datalist id={`${id}-list`}>{f.options?.map((o) => <option key={o} value={o} />)}</datalist>
              </>
            ) : (
              <input className="input" type={f.type ?? 'text'} {...common} />
            )}
            {f.help && <p style={{ fontSize: 13, marginTop: 4 }} className="muted">{f.help}</p>}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: -9999 }} aria-hidden="true">
        <label>Leave this empty<input type="text" name="company_site" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="check">
        <input type="checkbox" name="consent" />
        <span>{consentText}</span>
      </label>
      {state === 'error' && <p role="alert" style={{ color: 'var(--coral-text)', fontWeight: 700 }}>{error}</p>}
      <button type="submit" className="btn btn-dark" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}
