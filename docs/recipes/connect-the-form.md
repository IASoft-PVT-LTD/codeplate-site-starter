# Connect the form

Use when waitlist or contact submissions should reach the user instead of the server log: (A) a **webhook** (Slack, Discord, Zapier, Make, n8n; built in, no code), (B) an **email** to the user's inbox through Resend, or (C) **Buttondown** newsletter subscribers. Also: changing the form's fields or messages (D).

You can't create accounts or see dashboards. The user creates the account and gives you nothing secret in chat: tell them which variable to set, and where. Never put a key in a file that's committed; `.env` (local) is git-ignored. Record the choice (provider, never the keys) in `docs/project.md` under Form.

How it works now: `src/pages/api/subscribe.ts` calls `handleSubmission()` in `src/lib/form.ts`, which validates the fields and hands them to the provider that `providerFor()` picks from `FORM_PROVIDER`. A provider is one async function that receives `{ kind, email, name?, message?, page? }` and throws if sending failed (the visitor then sees "Something went wrong").

## A. Webhook (Slack, Discord, Zapier…)

1. The user creates the webhook and keeps its URL private:
   - **Slack:** create an app at api.slack.com/apps → **Incoming Webhooks** → on → **Add New Webhook to Workspace** → pick the channel. The URL starts with `https://hooks.slack.com/services/`.
   - **Discord:** channel → **Edit Channel** → **Integrations** → **Webhooks** → **New Webhook** → **Copy Webhook URL**.
   - **Zapier / Make / n8n:** a "Catch Hook" / "Custom webhook" trigger; then map `submission.email`, `submission.kind`, `submission.message` into a Google Sheet, a CRM or an email.
2. It's posted as JSON: `{ "text": "New waitlist sign-up: ada@example.com", "content": "<same text>", "submission": { "kind": "waitlist", "email": "…", "page": "/" } }`. Slack shows `text`, Discord shows `content`, automation tools read `submission`. Nothing to change in code.
3. Set the variables. Locally, in `.env` (create it; it's git-ignored):
   ```
   FORM_PROVIDER=webhook
   FORM_WEBHOOK_URL=https://hooks.slack.com/services/…
   ```
   On the host, set the same two in its settings (see `deploy.md`), then redeploy. Restart `npm run dev` after editing `.env`: variables are read when the server starts.

## B. Email to the user's inbox (Resend)

4. The user creates a Resend account, verifies their domain (Resend → **Domains**; DNS records at their domain host) and creates an API key with "sending access". Until the domain is verified, Resend only sends from `onboarding@resend.dev` to the account owner's own address, which is enough to test.
5. Add the provider to `src/lib/form.ts`, after `webhookProvider`:
   ```ts
   /** Emails each submission to `to` through Resend's API (https://resend.com/docs/api-reference/emails/send-email). */
   export function resendProvider(opts: { apiKey: string; to: string; from: string }, fetchImpl: typeof fetch = fetch): FormProvider {
     return async (s) => {
       const res = await fetchImpl('https://api.resend.com/emails', {
         method: 'POST',
         headers: { authorization: `Bearer ${opts.apiKey}`, 'content-type': 'application/json' },
         body: JSON.stringify({
           from: opts.from,
           to: [opts.to],
           reply_to: s.email,
           subject: s.kind === 'waitlist' ? `Waitlist: ${s.email}` : `Message from ${s.name ?? s.email}`,
           text: summary(s),
         }),
       });
       if (!res.ok) throw new Error(`Resend answered ${res.status}: ${await res.text()}`);
     };
   }
   ```
   `reply_to` means the user can answer a contact message straight from their inbox.
6. Extend the config type and `providerFor()` in the same file:
   ```ts
   export type FormConfig = {
     provider: 'console' | 'webhook' | 'resend';
     webhookUrl?: string;
     resend?: { apiKey?: string; to?: string; from?: string };
   };
   ```
   and, at the top of `providerFor()`:
   ```ts
   if (config.provider === 'resend') {
     const { apiKey, to, from } = config.resend ?? {};
     if (!apiKey || !to || !from) throw new Error('FORM_PROVIDER is "resend": set RESEND_API_KEY, FORM_EMAIL_TO and FORM_EMAIL_FROM');
     return resendProvider({ apiKey, to, from }, fetchImpl);
   }
   ```
7. Declare the variables in `env.schema` in `astro.config.mjs`: add `'resend'` to `values` of `FORM_PROVIDER`, and
   ```js
   RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
   FORM_EMAIL_TO: envField.string({ context: 'server', access: 'public', optional: true }),
   FORM_EMAIL_FROM: envField.string({ context: 'server', access: 'public', optional: true }),
   ```
   Document them in `.env.example` (the `env` check fails otherwise), in the Forms block:
   ```
   # FORM_PROVIDER=resend: email each submission (docs/recipes/connect-the-form.md, B).
   # Resend API key (Resend → API Keys). Secret.
   RESEND_API_KEY=
   # Who receives the emails, and the sender (an address on a domain verified in Resend).
   FORM_EMAIL_TO=
   FORM_EMAIL_FROM=
   ```
8. Pass them in `src/pages/api/subscribe.ts`:
   ```ts
   import { FORM_EMAIL_FROM, FORM_EMAIL_TO, FORM_PROVIDER, FORM_WEBHOOK_URL, RESEND_API_KEY } from 'astro:env/server';
   ```
   and `providerFor({ provider: FORM_PROVIDER, webhookUrl: FORM_WEBHOOK_URL, resend: { apiKey: RESEND_API_KEY, to: FORM_EMAIL_TO, from: FORM_EMAIL_FROM } })`.
9. Test it with a fake `fetch` in `tests/unit/form.test.ts` (the checks never call Resend):
   ```ts
   it('resend emails the submission with reply-to', async () => {
     const fetchMock = vi.fn(async () => new Response('{}'));
     await resendProvider({ apiKey: 're_test', to: 'me@example.com', from: 'Site <site@example.com>' }, fetchMock as unknown as typeof fetch)({ kind: 'contact', email: 'ada@example.com', name: 'Ada', message: 'Hi' });
     const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
     expect(url).toBe('https://api.resend.com/emails');
     expect((init.headers as Record<string, string>).authorization).toBe('Bearer re_test');
     const body = JSON.parse(String(init.body));
     expect(body).toMatchObject({ to: ['me@example.com'], reply_to: 'ada@example.com', subject: 'Message from Ada' });
   });
   ```
   (add `resendProvider` to the test file's import from `../../src/lib/form`).
10. The user sets `FORM_PROVIDER=resend`, `RESEND_API_KEY`, `FORM_EMAIL_TO` and `FORM_EMAIL_FROM` in `.env` and on the host.

## C. Newsletter subscribers (Buttondown)

Buttondown keeps a list of email subscribers; it can't receive contact messages. So the waitlist goes to Buttondown and contact messages go to the webhook (A) if `FORM_WEBHOOK_URL` is set, or the server log otherwise.

11. The user creates a Buttondown newsletter and copies the API key (Settings → **API**).
12. Add to `src/lib/form.ts`:
    ```ts
    /** Adds waitlist emails to Buttondown (https://docs.buttondown.com/api-subscribers-create); other kinds go to `other`. */
    export function buttondownProvider(apiKey: string, other: FormProvider, fetchImpl: typeof fetch = fetch): FormProvider {
      return async (s) => {
        if (s.kind !== 'waitlist') return other(s);
        const res = await fetchImpl('https://api.buttondown.com/v1/subscribers', {
          method: 'POST',
          headers: { authorization: `Token ${apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({ email_address: s.email, metadata: { page: s.page ?? '' } }),
        });
        // Signing up twice is not an error for the visitor.
        if (!res.ok && !/already/i.test(await res.text())) throw new Error(`Buttondown answered ${res.status}`);
      };
    }
    ```
    Add `'buttondown'` to `FormConfig['provider']` and a `buttondownKey?: string` field, and at the top of `providerFor()`:
    ```ts
    if (config.provider === 'buttondown') {
      if (!config.buttondownKey) throw new Error('FORM_PROVIDER is "buttondown" but BUTTONDOWN_API_KEY is not set');
      const other = config.webhookUrl ? webhookProvider(config.webhookUrl, fetchImpl) : consoleProvider();
      return buttondownProvider(config.buttondownKey, other, fetchImpl);
    }
    ```
13. As in steps 7–8: add `'buttondown'` to `FORM_PROVIDER`'s `values`, declare `BUTTONDOWN_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true })`, document it in `.env.example`, import it in `src/pages/api/subscribe.ts` and pass `buttondownKey: BUTTONDOWN_API_KEY`. Add a unit test like step 9's: the waitlist posts `email_address` with `Token <key>`, and a contact message goes to the other provider.

## D. Change the fields or the messages

14. **Messages** shown after sending: `messages` in `src/lib/form.ts`. Error texts: the zod messages in `submissionSchema`, and the strings in the `<script>` of `src/components/SubscribeForm.astro`. `tests/e2e/form.spec.ts` checks the success texts: update it when you change them (AGENTS.md rule 8).
15. **A new field** (e.g. company size on the waitlist): add the input with a `<label>` in `SubscribeForm.astro`, the field to `submissionSchema` (optional unless it must be filled), and a line for it in `summary()` so providers include it. Add a unit test that it's accepted and passed on.
16. **Spam.** The hidden `website` field catches simple bots. If spam gets through, add a rate limit at the host (Cloudflare: a WAF rate-limiting rule on `/api/subscribe`) or a CAPTCHA such as Cloudflare Turnstile (its widget in the form, its token checked in `handleSubmission()` with a server-side secret).

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS` (the screen tests always use `FORM_PROVIDER=console`; your unit tests cover the new provider with a fake `fetch`).
2. With the user's real values in `.env`, run `npm run dev`, submit the waitlist form on http://localhost:4321/#waitlist and the contact form on `/contact/`, and ask the user to confirm the message arrived (Slack/Discord channel, inbox, or Buttondown → Subscribers). The dev server's output shows `[form] could not send the submission: …` if the provider refused it. **You can't see the user's inbox or channel yourself: say so, and ask.**
3. After deploying, submit both forms once on the live site and have the user confirm again.

The Resend and Buttondown code above follows their API docs (linked in the code comments) and is covered by unit tests with a fake `fetch`; it has not been run against the real services from this template. If a provider answers with an error, the dev server prints its status and message: compare the request with the provider's current docs page and adjust.
