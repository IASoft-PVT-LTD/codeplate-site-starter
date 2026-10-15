// The waitlist and contact forms, server side: validate a submission, hand it
// to a provider, answer the browser. src/pages/api/subscribe.ts calls
// handleSubmission() with the provider chosen by FORM_PROVIDER. No Astro
// imports here, so tests/unit/form.test.ts runs it with a fake provider.
//
// Providers (docs/recipes/connect-the-form.md adds Resend and Buttondown):
//   console   prints the submission in the server log (development, the checks)
//   webhook   POSTs JSON to FORM_WEBHOOK_URL (Slack, Discord, Zapier, Make, n8n…)
import { z } from 'astro/zod';

export const FORM_KINDS = ['waitlist', 'contact'] as const;
export type FormKind = (typeof FORM_KINDS)[number];

/** What a form posts. `website` is a honeypot: hidden from people, filled in by bots. */
export const submissionSchema = z
  .object({
    kind: z.enum(FORM_KINDS),
    email: z.email('Enter a valid email address.').max(200),
    name: z.string().trim().max(100).optional(),
    message: z.string().trim().max(5000).optional(),
    /** The page the form was on, for context in the notification. */
    page: z.string().max(300).optional(),
    website: z.string().max(0).optional(),
  })
  .refine((s) => s.kind !== 'contact' || (s.message && s.message.length > 0), {
    message: 'Write a message.',
    path: ['message'],
  });

export type Submission = Omit<z.infer<typeof submissionSchema>, 'website'>;

/** Sends one submission somewhere. Throws if it couldn't. */
export type FormProvider = (submission: Submission) => Promise<void>;

export type FormConfig = { provider: 'console' | 'webhook'; webhookUrl?: string };

export const messages: Record<FormKind, string> = {
  waitlist: 'You’re on the list. We’ll email you when there’s room.',
  contact: 'Thanks! We’ll reply within two working days.',
};

/** One line of text describing a submission (used by the console and webhook providers). */
export function summary(s: Submission): string {
  const who = s.name ? `${s.name} <${s.email}>` : s.email;
  const head = s.kind === 'waitlist' ? `New waitlist sign-up: ${who}` : `New message from ${who}`;
  return [head, s.message, s.page ? `(from ${s.page})` : ''].filter(Boolean).join('\n');
}

export function consoleProvider(log: (line: string) => void = console.log): FormProvider {
  return async (s) => log(`[form] ${summary(s).replace(/\n/g, '\n[form] ')}`);
}

/**
 * POSTs { text, content, submission } as JSON. Slack incoming webhooks read
 * `text`, Discord reads `content`, automation tools can use `submission`.
 */
export function webhookProvider(url: string, fetchImpl: typeof fetch = fetch): FormProvider {
  return async (s) => {
    const text = summary(s);
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, content: text, submission: s }),
    });
    if (!res.ok) throw new Error(`webhook answered ${res.status}`);
  };
}

export function providerFor(config: FormConfig, fetchImpl: typeof fetch = fetch): FormProvider {
  if (config.provider === 'webhook') {
    if (!config.webhookUrl) throw new Error('FORM_PROVIDER is "webhook" but FORM_WEBHOOK_URL is not set');
    return webhookProvider(config.webhookUrl, fetchImpl);
  }
  return consoleProvider();
}

export type ParseResult =
  | { ok: true; spam: boolean; submission: Submission }
  | { ok: false; errors: Record<string, string> };

/** Validates form fields (from FormData or a JSON body). */
export function parseSubmission(input: FormData | Record<string, unknown>): ParseResult {
  const raw: Record<string, unknown> = {};
  const entries = input instanceof FormData ? [...input.entries()] : Object.entries(input);
  for (const [k, v] of entries) if (typeof v === 'string' && v !== '') raw[k] = v;
  if (typeof raw.email === 'string') raw.email = raw.email.trim();
  // A filled honeypot is a bot: report success, send nothing.
  const spam = typeof raw.website === 'string' && raw.website.length > 0;
  if (spam) delete raw.website;
  const r = submissionSchema.safeParse(raw);
  if (!r.success) {
    const errors: Record<string, string> = {};
    for (const issue of r.error.issues) errors[String(issue.path[0] ?? 'form')] ??= issue.message;
    return { ok: false, errors };
  }
  const { website: _honeypot, ...submission } = r.data;
  return { ok: true, spam, submission };
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

/**
 * Handles one POST. Browsers with JavaScript send `Accept: application/json` and
 * get JSON back (src/components/SubscribeForm.astro shows the message). Without
 * JavaScript the form posts normally and gets a redirect: /thanks/ on success,
 * or back to the form's page with ?form=error.
 */
export async function handleSubmission(request: Request, getProvider: () => FormProvider): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let input: FormData | Record<string, unknown>;
  try {
    input = (request.headers.get('content-type') ?? '').includes('application/json') ? await request.json() : await request.formData();
  } catch {
    return json({ ok: false, errors: { form: 'Could not read the form.' } }, 400);
  }
  const parsed = parseSubmission(input);
  const back = (query: string) => {
    const from = parsed.ok ? parsed.submission.page : typeof (input as FormData).get === 'function' ? (input as FormData).get('page') : undefined;
    const path = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
    return new Response(null, { status: 303, headers: { location: `${path}${path.includes('?') ? '&' : '?'}${query}` } });
  };
  if (!parsed.ok) return wantsJson ? json({ ok: false, errors: parsed.errors }, 400) : back('form=error');
  const { submission, spam } = parsed;
  if (!spam) {
    try {
      await getProvider()(submission);
    } catch (e) {
      console.error(`[form] could not send the submission: ${e instanceof Error ? e.message : e}`);
      return wantsJson ? json({ ok: false, errors: { form: 'Something went wrong. Please try again, or email us.' } }, 502) : back('form=failed');
    }
  }
  return wantsJson ? json({ ok: true, message: messages[submission.kind] }, 200) : new Response(null, { status: 303, headers: { location: '/thanks/' } });
}
