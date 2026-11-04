# shauna.dev: facts for the site assistant

## About
- **Shauna Arnold**, product designer and developer, Honolulu.
- Builds the design system and ships the product on top of it.
- Earlier: retail brand marketing at Nike (2008 to 2014) and a producer role at Apple (2016).
- Résumé: https://shauna.dev/resume/ (PDF download on that page).
- Contact: the **Work With Me** button in the header, or https://shauna.dev/#contact

## The design system
- One token file, `tokens/tokens.json`, builds the CSS in `src/styles/tokens.css`, the Figma library and the rules Claude reads.
- Rules for people and for Claude: `DESIGN.md` at the root of the repo.
- Two typefaces (DM Serif Display, LINE Seed JP), 12 type sizes, 4px spacing base, nine base colours, Day & Dusk themes.
- Live specimen: https://shauna.dev/system/
- Figma library: https://www.figma.com/design/UaYBadfQohgJvDGDvsVItd

## Checks (`npm run check:ui`, on every build)
1. Text contrast at or above 4.5:1 in day and dusk
2. Colour, type & spacing from tokens only
3. Title Case buttons, no em dashes
4. Alt text and accessible labels
5. Motion: one curve, reduced-motion respected
6. Only links/buttons move on hover
7. Every phone screen inside the one phone frame

## Case studies
| Case | URL | One line |
|---|---|---|
| Rescue platform | https://shauna.dev/work/rescue-platform/ | One system across three live apps for an animal rescue |
| Testing a design system on Claude | https://shauna.dev/work/ai-design-systems/ | 240 page builds: standard DESIGN.md vs her system |
| Retail brand programs | https://shauna.dev/work/retail-brand-programs/ | Nike brand guidelines and a $10M+ portfolio |
| Outreach app | https://shauna.dev/work/outreach-app/ | Field app for pet food outreach events |

## Round 2 eval (2 Nov 2026)
- 240 builds, Claude Sonnet 5.5, 12 screens x 5 builds x 2 wordings x 2 groups.
- Standard DESIGN.md: 118/120 pages passed, but 30 button styles & 16 field styles.
- Her system: 120/120 passed, 7 button styles & 4 field styles.
- Data download: linked from the case study, e.g. scripts, fixtures, builds and scores.

## The chat composer
- Live on https://shauna.dev/system/#composer
- States: Empty, Ready, Streaming, Stopped, Error, Finished, Listening, Speaking, Interrupted.
- Every control 44px; keyboard: Enter sends, Shift+Enter new line, Esc stops; screen reader announcements.

## Tools
- Claude Code, Figma, Astro, React, TypeScript, Supabase, Vercel, Netlify.
