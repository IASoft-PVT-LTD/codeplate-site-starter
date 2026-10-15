// POST /api/subscribe: the waitlist and contact forms. The logic is in
// src/lib/form.ts; this file only wires in the configured provider.
// It runs on the server (prerender = false), through the adapter in astro.config.mjs.
import type { APIRoute } from 'astro';
import { FORM_PROVIDER, FORM_WEBHOOK_URL } from 'astro:env/server';
import { handleSubmission, providerFor } from '../../lib/form';

export const prerender = false;

export const POST: APIRoute = ({ request }) =>
  handleSubmission(request, () => providerFor({ provider: FORM_PROVIDER, webhookUrl: FORM_WEBHOOK_URL }));
