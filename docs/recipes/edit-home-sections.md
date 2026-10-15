# Edit the home page sections

Use when the user wants to change what the home page says, reorder or drop its sections, swap the screenshot, or add a new section (how it works, a menu, opening hours, a team row…). The example removes the placeholder logo strip and testimonials, and adds a three-step **How it works** section.

The home page is a list of section components in `src/pages/index.astro`. Each one lives in `src/components/home/` and takes its words from one export of `src/data/home.ts`:

| Section | Component | Data in `src/data/home.ts` |
|---|---|---|
| Hero (title, intro, two buttons) | `Hero.astro` | `hero` |
| Logo strip | `LogoStrip.astro` | `logos` |
| Features grid | `Features.astro` | `featuresTitle`, `features` (`icon` is a name from `src/components/Icon.astro`) |
| Screenshot | `Screenshot.astro` | `screenshot` (+ the image `src/assets/screenshot.png`) |
| Testimonials | `Testimonials.astro` | `testimonials` |
| Pricing teaser | `PricingTeaser.astro` | `pricingTeaser` |
| FAQ | `Faq.astro` | `faq` |
| Waitlist (id `waitlist`) | `Cta.astro` | `cta` (the form is `SubscribeForm.astro`) |

1. **Change the words** in `src/data/home.ts`. Keep each text short: a hero title under about 50 characters reads on two lines on a phone; feature texts of one or two sentences keep the cards even. Testimonials, customer names and numbers must be real (with permission) or removed (AGENTS.md rule 9).

2. **Reorder** by moving the component lines in `src/pages/index.astro`. Every section manages its own spacing, so nothing else changes.

3. **Remove a section**: delete its line and its `import` in `src/pages/index.astro`, then delete its export from `src/data/home.ts` and its component file if nothing else uses it (`npm run typecheck` reports a leftover import). For the example:
   - remove `<LogoStrip />`, `<Testimonials />` and their imports;
   - delete `src/components/home/LogoStrip.astro` and `Testimonials.astro`, and the `logos` and `testimonials` exports.

   Links to a removed section break: removing `<Cta />` (id `waitlist`) breaks every `/#waitlist` link (`hero.primary`, `site.cta`, the plans' buttons), and `npm run check`'s `links` step lists each one. Point them somewhere else first, e.g. `/contact/`.

4. **Add a section.** Put its words in `src/data/home.ts`:
   ```ts
   export const howItWorks = {
     title: 'How it works',
     steps: [
       { title: 'Answer three questions', text: 'Each morning, from the browser, Slack or email. It takes two minutes.' },
       { title: 'Read one digest', text: 'Everyone’s updates on one page, blockers first, at a time that suits your time zone.' },
       { title: 'Unblock each other', text: 'Reply where it helps. The person who is stuck hears back the same day.' },
     ],
   };
   ```
   Then create `src/components/home/HowItWorks.astro`, styled with the tokens like its neighbours (rule 3), with an `id` and `aria-labelledby` so it can be linked to and is announced by screen readers:
   ```astro
   ---
   // Home: three numbered steps (src/data/home.ts `howItWorks`).
   import { howItWorks } from '../../data/home';
   ---

   <section id="how-it-works" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6" aria-labelledby="how-title">
     <h2 id="how-title" class="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{howItWorks.title}</h2>
     <ol class="mt-12 grid gap-6 md:grid-cols-3">
       {
         howItWorks.steps.map((step, i) => (
           <li class="rounded-(--radius-card) border border-line bg-paper p-6">
             <span class="inline-flex size-9 items-center justify-center rounded-full bg-brand font-bold text-on-brand">{i + 1}</span>
             <h3 class="mt-4 text-lg font-bold">{step.title}</h3>
             <p class="mt-2 text-ink-soft">{step.text}</p>
           </li>
         ))
       }
     </ol>
   </section>
   ```
   and place it in `src/pages/index.astro` (`import HowItWorks from '../components/home/HowItWorks.astro';`, then `<HowItWorks />` after `<Features />`). A section with an image uses `<Image>` from `astro:assets` with an image in `src/assets/` and its alt text in the data file (see `Screenshot.astro`). A section that needs interaction should use HTML first (`<details>`, links), per rule 4.

5. **Swap the screenshot.** Replace `src/assets/screenshot.png` with the user's own image (any size; about 1600 px wide is plenty, Astro makes the smaller versions) and rewrite `screenshot.alt` in `src/data/home.ts` to say what it shows. For a `.jpg` or `.webp`, change the import in `src/components/home/Screenshot.astro`.

6. **Link to the new section** if it helps: add `{ label: 'How it works', href: '/#how-it-works' }` to `nav` or a footer column in `src/data/site.ts`. The link check verifies the `id` exists.

## Verify

1. `npm run check` ends with `CODEPLATE CHECKS: PASS`. The `links` step catches links to removed sections; `types` catches leftover imports.
2. Screenshots of the whole page, desktop, phone and dark:
   ```
   npm run shots -- /
   npm run shots -- / --width=390
   npm run shots -- / --dark
   ```
   Check that the sections are in the intended order, the new section's cards line up (three across on desktop, stacked on the phone), and every text is readable in both modes.
