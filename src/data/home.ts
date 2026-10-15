// The words on the home page, section by section. src/pages/index.astro puts
// the sections in order; each section component reads its part from here.
// docs/recipes/edit-home-sections.md explains how to change, reorder or drop them.
import type { IconName } from '../components/Icon.astro';

export const hero = {
  eyebrow: 'Now in early access',
  title: 'Skip the stand-up. Keep the team in sync.',
  intro:
    'Brightside asks everyone three short questions each morning and turns the answers into one calm daily digest. No meeting, no time zones to juggle.',
  primary: { label: 'Join the waitlist', href: '#waitlist' },
  secondary: { label: 'See pricing', href: '/pricing/' },
};

/** Made-up teams for the logo strip. Replace them with real customers (with permission) or remove the section. */
export const logos = {
  title: 'Teams trying Brightside this season',
  names: ['Northwind Labs', 'Fernhill', 'Quietcraft', 'Lumen & Co', 'Paperboat'],
};

export const featuresTitle = 'Everything a check-in needs. Nothing it doesn’t.';

/** `icon` is a name from src/components/Icon.astro. */
export const features: { title: string; text: string; icon: IconName }[] = [
  { icon: 'sun', title: 'A two-minute check-in', text: 'Three questions each morning: what you did, what is next, what is in the way. Answer from the browser, Slack or email.' },
  { icon: 'digest', title: 'One digest, not forty messages', text: 'Everyone gets a single summary at the time that suits their time zone, with blockers at the top.' },
  { icon: 'flag', title: 'Blockers get noticed', text: 'When someone is stuck, the right person is told the same day, so small problems stay small.' },
  { icon: 'chart', title: 'Mood without surveillance', text: 'An optional mood score shows how the team is doing over weeks, never who said what.' },
  { icon: 'lock', title: 'Private by default', text: 'Check-ins are visible to your team only. Export or delete everything at any time.' },
  { icon: 'plug', title: 'Works with your tools', text: 'Links to issues and pull requests unfurl, and the digest can post to a channel of your choice.' },
];

export const screenshot = {
  title: 'Your whole team on one calm page',
  text: 'The digest groups updates by person and puts blockers first. Read it in a minute, reply where it helps.',
  alt: 'The Brightside daily digest: four teammates’ check-ins with one blocker highlighted at the top.',
};

export const testimonials = {
  title: 'What early teams say',
  items: [
    { quote: 'We dropped our 9:30 call in the first week. Nobody misses it, and we hear about blockers sooner.', name: 'Amara Osei', role: 'Engineering lead, Fernhill' },
    { quote: 'Half the team is in Lisbon, half in Manila. Brightside is the first thing that works for both.', name: 'Jonas Weber', role: 'Founder, Paperboat' },
    { quote: 'The mood trend told us we were overloaded a month before anyone said it out loud.', name: 'Priya Raman', role: 'Product manager, Quietcraft' },
  ],
};

export const pricingTeaser = {
  title: 'Free for small teams',
  text: 'Up to 5 people free, forever. Bigger teams pay per person, per month.',
  link: { label: 'Compare plans', href: '/pricing/' },
};

export const faq = {
  title: 'Questions',
  items: [
    { q: 'When can we start?', a: 'Brightside is in early access. Join the waitlist and we will invite teams in small groups over the coming weeks.' },
    { q: 'Does everyone need an account?', a: 'Each teammate signs in with their work email. Guests can read a digest you share with them without an account.' },
    { q: 'Can we answer from Slack?', a: 'Yes. Brightside sends the questions as a direct message and saves the answers, so nobody has to open another app.' },
    { q: 'Where is our data stored?', a: 'In the EU, encrypted at rest. You can export or delete your team’s data at any time from the settings.' },
    { q: 'What happens after the free plan?', a: 'Nothing changes unless your team grows past five people. Then you choose a paid plan or stay at five.' },
  ],
};

export const cta = {
  title: 'Try a week without the stand-up',
  text: 'Join the waitlist and we will send your invite as soon as there is room. One email, no spam.',
};
