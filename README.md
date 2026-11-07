# Shauna Arnold's design system

The design system behind [shauna.dev](https://shauna.dev/system/), published so you can read it, run it and test it.

More and more of an interface is now built by AI, and AI doesn't learn a team's rules over time or sit in design review. This system is written for three readers: people, Figma and Claude. One token file feeds all three, the build fails when a page breaks a rule, and every rule here has been tested on Claude.

## What's inside

| Folder or file | What it is |
|---|---|
| `tokens/tokens.json` | Every colour, size, space, radius and motion value, for Day and Dusk themes. The one source. |
| `DESIGN.md` | The rules, written for people and for Claude. Claude reads this before it builds any UI. |
| `scripts/tokens.mjs` | Turns the token file into CSS (`build/tokens.css`, or wherever `--out` says). The build fails if a colour drifts from its role. |
| `checks/check-ui.mjs` | The nine checks that run on every build of shauna.dev: contrast in both themes, tokens only, the serif only for headlines, button wording, labels and alt text, motion, hover, the one phone frame, and 44 x 44px controls. It runs against a built site; `check_html` in the server runs the same static rules on any snippet. |
| `checks/checks.json` | The name and a one-line description of each check, for a site to show the list without copying it. |
| `mcp/server.mjs` | A small server Claude can connect to. It reads the tokens and rules, and checks Claude's own work before it hands it over. |
| `eval/` | The tests that measured whether Claude follows the system, with every build, script and score. |
| `figma-plugin/` | Rebuilds the Figma library's variables and base components from the same token file. |

## Results

| Test | Without the system | With the system |
|---|---|---|
| Whole product, 12 pages built 10 times each (round 2) | 118 of 120 pages passed, but 30 different button styles and 16 field styles | 120 of 120 passed, with 7 button styles and 4 field styles |
| Spoken answers, 12 visitor questions | 77 of 180 answers easy to listen to | 60 of 60 with the final rules |

Each test's own README in `eval/` has the method, every number and what each failure taught.

## Use it with Claude

```
npm install
claude mcp add design-system -- node "$(pwd)/mcp/server.mjs"
```

Tools the server offers:

- `get_tokens` lists token groups, or returns one group's values.
- `list_rules` lists the DESIGN.md sections, or returns one.
- `get_component` returns one component's spec: parts, sizes, states and rules.
- `check_html` checks a snippet of HTML and CSS against the build's rules and returns each failure with the rule it broke.
- `check_spoken` checks an answer that will be read aloud against the spoken-answer rules.

`npm test` runs the spoken-answer checker on its examples and calls every server tool.

## Use it in a project

shauna.dev is moving to install this as a package. Until then it keeps its own copies of these files, in sync with this repository. To install it in a project:

```
npm install github:shaunadigital/design-system
```

Installing runs `prepare`, which builds `tokens.css`. On npm 11 or newer, approve it with `npm install-scripts approve @shaunadigital/design-system`, so it still runs if npm is set to block install scripts it hasn't been told about (`strict-allow-scripts`). If it doesn't run, `tokens.css` is missing.

**Tokens.** Import the CSS, or the JSON for anything that reads values in code:

```css
@import '@shaunadigital/design-system/tokens.css';
```

```js
import tokens from '@shaunadigital/design-system/tokens.json';
```

To write the CSS into the site instead, run `node node_modules/@shaunadigital/design-system/scripts/tokens.mjs --out src/styles/tokens.css`.

**Rules.** `@shaunadigital/design-system/DESIGN.md` is exported, so a site can show the rules and hand the same file to Claude.

**Checks.** Run them after the site builds:

```json
"scripts": {
  "build": "astro build && design-system-check-ui"
}
```

`design-system-check-ui` checks the site in the current directory. `--root <path>` checks another one. `--config <file.json>` sets what to check:

```json
{
  "dist": "dist",
  "src": ["src/styles/v2.css", "src/components/v2/", "src/pages/index.astro"],
  "reducedMotionCss": "src/styles/v2.css"
}
```

`dist` is the built site, `src` lists the files whose style code is checked (a path ending in `/` means everything under it), and `reducedMotionCss` is the stylesheet that must hold the reduced-motion rule. Anything left out keeps the default, which is shauna.dev's layout. A listed path that doesn't exist fails the check, so a renamed page can't drop out quietly. The tokens always come from this package.

**The list of checks.** `@shaunadigital/design-system/checks.json` has each check's `id`, `name` (the line the check prints) and `description`, so a site can show the list without keeping its own copy.

## Run the evals

The evals call Claude through Claude Code, so they run on a machine where `claude` is signed in. The voice eval:

```
npm run eval:voice
```

Finished answers are kept and skipped on the next run, so only new groups run. The round 2 runner is `eval/round2.sh`.

## Where it comes from

This repository is the one source for the system. shauna.dev is moving to install it as a package, and until then it keeps its own copies in sync with this one. The site's own pages and client work are not part of this repository.

Shauna Arnold, product designer and developer, Honolulu. [shauna.dev](https://shauna.dev)

## Licence

MIT. See LICENSE.
