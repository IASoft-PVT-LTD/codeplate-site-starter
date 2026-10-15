// Plans on the pricing page (src/pages/pricing.astro) and the home page teaser.
// Prices are display text only: this site doesn't take payments. Exactly one
// plan should have `highlight: true` (tests/unit/data.test.ts checks it).

/** The words at the top of /pricing/ and its meta description. */
export const pricingPage = {
  eyebrow: 'Pricing',
  title: 'Simple plans that grow with your team',
  intro: 'Start free. Upgrade when your team grows, and only pay for the people who check in.',
  description: 'Brightside is free for teams of up to five. Bigger teams pay per person, per month.',
};

export type Plan = {
  name: string;
  price: string;
  /** Shown under the price, e.g. "per person / month". */
  period: string;
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
};

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    period: 'up to 5 people',
    blurb: 'For small teams trying async check-ins.',
    features: ['Daily check-ins and digest', 'Slack and email answers', '30 days of history'],
    cta: { label: 'Join the waitlist', href: '/#waitlist' },
  },
  {
    name: 'Team',
    price: '$4',
    period: 'per person / month',
    blurb: 'For teams that run on Brightside every day.',
    features: ['Everything in Starter', 'Unlimited history', 'Blocker alerts', 'Mood trends', 'Custom questions'],
    cta: { label: 'Join the waitlist', href: '/#waitlist' },
    highlight: true,
  },
  {
    name: 'Company',
    price: 'Let’s talk',
    period: 'for 50+ people',
    blurb: 'For several teams with admin needs.',
    features: ['Everything in Team', 'SSO and SCIM', 'Data residency choice', 'Priority support'],
    cta: { label: 'Contact us', href: '/contact/' },
  },
];

/** Shown under the plans. */
export const pricingNote = 'Prices are in US dollars and exclude tax. Annual billing saves two months.';

export const pricingFaq = [
  { q: 'Is there a free trial of Team?', a: 'Every new team gets Team features free for 30 days, then picks a plan.' },
  { q: 'Can we pay by invoice?', a: 'Yes, on the Company plan.' },
];
