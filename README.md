# Shauna Arnold's design system

The design system behind [shauna.dev](https://shauna.dev/system/), published so you can read it, run it and test it.

More and more of an interface is now built by AI, and AI doesn't learn a team's rules over time or sit in design review. This system is written for three readers: people, Figma and Claude. One token file feeds all three, the build fails when a page breaks a rule, and every rule here has been tested on Claude.

## What's inside

| Folder or file | What it is |
|---|---|
| `tokens/tokens.json` | Every colour, size, space, radius and motion value, for Day and Dusk themes. The one source. |
| `DESIGN.md` | The rules, written for people and for Claude. Claude reads this before it builds any UI. |
| `scripts/tokens.mjs` | Turns the token file into CSS (`build/tokens.css`). The build fails if a colour drifts from its role. |
| `checks/check-ui.mjs` | The seven checks that run on every build of shauna.dev: contrast in both themes, tokens only, button wording, labels and alt text, motion, hover, and the one phone frame. |
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

## Use the tokens in a project

```
npm install github:shaunadigital/design-system
```

```css
@import '@shaunadigital/design-system/tokens.css';
```

`@shaunadigital/design-system/tokens.json` and `DESIGN.md` are exported too, so a project can hand the same rules to Claude.

## Run the evals

The evals call Claude through Claude Code, so they run on a machine where `claude` is signed in. The voice eval:

```
npm run eval:voice
```

Finished answers are kept and skipped on the next run, so only new groups run. The round 2 runner is `eval/round2.sh`.

## Where it comes from

This is the system from the shauna.dev repo, kept in step with it. The site's own pages and client work are not part of this repository.

Shauna Arnold, product designer and developer, Honolulu. [shauna.dev](https://shauna.dev)

## Licence

MIT. See LICENSE.
