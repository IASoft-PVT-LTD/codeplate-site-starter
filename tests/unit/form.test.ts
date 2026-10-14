// The form handler (src/lib/form.ts): validation, the honeypot, providers and
// the answers it gives browsers with and without JavaScript.
import { describe, expect, it, vi } from 'vitest';
import { consoleProvider, handleSubmission, messages, parseSubmission, providerFor, webhookProvider, type Submission } from '../../src/lib/form';

const post = (fields: Record<string, string>, accept = 'application/json') =>
  new Request('http://localhost/api/subscribe', { method: 'POST', body: new URLSearchParams(fields), headers: { accept, 'content-type': 'application/x-www-form-urlencoded' } });

/** A provider that records what it was given. */
function recorder() {
  const sent: Submission[] = [];
  return { sent, provider: async (s: Submission) => void sent.push(s) };
}

describe('parseSubmission', () => {
  it('accepts a waitlist email and trims it', () => {
    const r = parseSubmission({ kind: 'waitlist', email: '  ada@example.com ' });
    expect(r).toEqual({ ok: true, spam: false, submission: { kind: 'waitlist', email: 'ada@example.com' } });
  });

  it('rejects a bad email with a readable message', () => {
    const r = parseSubmission({ kind: 'waitlist', email: 'not-an-email' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.email).toBe('Enter a valid email address.');
  });

  it('needs a message on the contact form', () => {
    const r = parseSubmission({ kind: 'contact', email: 'ada@example.com' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.message).toBe('Write a message.');
  });

  it('rejects an unknown form kind', () => {
    expect(parseSubmission({ kind: 'order', email: 'ada@example.com' }).ok).toBe(false);
  });

  it('marks a filled honeypot as spam', () => {
    const r = parseSubmission({ kind: 'waitlist', email: 'bot@example.com', website: 'http://spam.example' });
    expect(r.ok && r.spam).toBe(true);
  });
});

describe('handleSubmission', () => {
  it('sends a valid submission and answers JSON', async () => {
    const { sent, provider } = recorder();
    const res = await handleSubmission(post({ kind: 'waitlist', email: 'ada@example.com', page: '/' }), () => provider);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, message: messages.waitlist });
    expect(sent).toEqual([{ kind: 'waitlist', email: 'ada@example.com', page: '/' }]);
  });

  it('answers 400 with field errors and sends nothing', async () => {
    const { sent, provider } = recorder();
    const res = await handleSubmission(post({ kind: 'contact', email: 'nope' }), () => provider);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors)).toEqual(expect.arrayContaining(['email', 'message']));
    expect(sent).toEqual([]);
  });

  it('pretends to accept spam without sending it', async () => {
    const { sent, provider } = recorder();
    const res = await handleSubmission(post({ kind: 'waitlist', email: 'bot@example.com', website: 'x' }), () => provider);
    expect(res.status).toBe(200);
    expect(sent).toEqual([]);
  });

  it('answers 502 when the provider fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await handleSubmission(post({ kind: 'waitlist', email: 'ada@example.com' }), () => async () => {
      throw new Error('down');
    });
    expect(res.status).toBe(502);
    vi.restoreAllMocks();
  });

  it('redirects browsers without JavaScript', async () => {
    const { provider } = recorder();
    const ok = await handleSubmission(post({ kind: 'waitlist', email: 'ada@example.com', page: '/' }, 'text/html'), () => provider);
    expect(ok.status).toBe(303);
    expect(ok.headers.get('location')).toBe('/thanks/');
    const bad = await handleSubmission(post({ kind: 'waitlist', email: 'nope', page: '/contact/' }, 'text/html'), () => provider);
    expect(bad.headers.get('location')).toBe('/contact/?form=error');
  });

  it('never redirects to another site', async () => {
    const { provider } = recorder();
    const res = await handleSubmission(post({ kind: 'waitlist', email: 'nope', page: '//evil.example/' }, 'text/html'), () => provider);
    expect(res.headers.get('location')).toBe('/?form=error');
  });

  it('accepts a JSON body', async () => {
    const { sent, provider } = recorder();
    const req = new Request('http://localhost/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ kind: 'contact', email: 'ada@example.com', message: 'Hi' }),
      headers: { accept: 'application/json', 'content-type': 'application/json' },
    });
    expect((await handleSubmission(req, () => provider)).status).toBe(200);
    expect(sent[0]?.message).toBe('Hi');
  });
});

describe('providers', () => {
  it('console prints a summary', async () => {
    const lines: string[] = [];
    await consoleProvider((l) => lines.push(l))({ kind: 'contact', email: 'ada@example.com', name: 'Ada', message: 'Hello' });
    expect(lines[0]).toContain('New message from Ada <ada@example.com>');
    expect(lines[0]).toContain('Hello');
  });

  it('webhook posts JSON that Slack and Discord understand', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'));
    await webhookProvider('https://hooks.example/abc', fetchMock as unknown as typeof fetch)({ kind: 'waitlist', email: 'ada@example.com' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://hooks.example/abc');
    const body = JSON.parse(String(init.body));
    expect(body.text).toBe('New waitlist sign-up: ada@example.com');
    expect(body.content).toBe(body.text);
    expect(body.submission.email).toBe('ada@example.com');
  });

  it('webhook throws when the receiver refuses', async () => {
    const fetchMock = async () => new Response('no', { status: 404 });
    await expect(webhookProvider('https://hooks.example/abc', fetchMock as typeof fetch)({ kind: 'waitlist', email: 'a@b.co' })).rejects.toThrow('404');
  });

  it('webhook without a URL is a configuration error', () => {
    expect(() => providerFor({ provider: 'webhook' })).toThrow('FORM_WEBHOOK_URL');
  });
});
