# Voice eval: does Claude follow the spoken-reply rules?

Added 2026-11-03 for /system, 09 Beyond the Screen. Same method as round 2 (eval/round2.sh): Claude Code in safe mode,
Claude Sonnet 5.5 pinned, tools limited to Read, Write and Glob, one clean folder per reply.

## The question
A voice assistant gets the same material a screen assistant gets: notes full of links, file paths, lists and tables.
If you only tell Claude "this will be read aloud", does it write for the ear? And do written rules close the gap?

## Method
- **12 questions** a visitor might ask out loud (`questions.json`), **5 replies each**, **two groups**: 120 replies.
- `brief`: the folder holds `FACTS.md` (site facts in ordinary markdown: links, file paths, a table, a numbered list,
  "&" and "e.g."). The prompt says the reply will be read aloud by a text-to-speech engine.
- `rules`: the same, plus `VOICE.md` from `VOICE-v1.md`, the "Spoken replies" rules as first tested (frozen).
- `rules-v2`: the same, with `VOICE.md` pulled from DESIGN.md at run time (the current rules, only the "- " lines).
- **Scoring** (`score.mjs`, no model involved): 60 words or fewer, no sentence over 25 words, no markdown, no links,
  file paths or email addresses, no shorthand (e.g., i.e., etc., vs., &, a slash between words), no emoji. Limits come
  from tokens.json `voice`. A reply passes only if it breaks none. `node eval/voice/score.mjs --test` checks the
  checker on 14 hand-written examples.

## Run it (on the Mac, where `claude` is signed in)
    git pull
    npm run eval:voice        # or: P=4 bash eval/voice/run.sh   (safe to stop and re-run)
Then commit `eval/voice/runs` and `eval/voice/summary.json`. Expect roughly 15 to 30 minutes and a few dollars at list prices.

## Results
Run 1, 2026-11-03, on Shauna's Mac (Claude Code, claude-sonnet-5-5), 120 replies:

| Group | Passed every rule | Median words | Too long | Long sentence | Markdown | Links or file names | Shorthand | Emoji |
|---|---|---|---|---|---|---|---|---|
| brief (told only "read aloud") | 24/60 | 75 | 34 | 3 | 0 | 5 | 0 | 0 |
| rules (v1) | 52/60 | 36 | 0 | 6 | 0 | 2 | 0 | 0 |

Run 2, same day, same rules and runner (a full repeat, kept in `run2/`, scored with `RUNS=run2 node eval/voice/score.mjs`):

| Group | Passed every rule | Median words | Too long | Long sentence | Markdown | Links or file names | Shorthand | Emoji |
|---|---|---|---|---|---|---|---|---|
| brief | 26/60 | 76 | 34 | 5 | 0 | 5 | 0 | 0 |
| rules (v1) | 55/60 | 35 | 0 | 5 | 0 | 0 | 0 | 0 |

Run 3, same day, another full repeat (`run3/`): brief 27/60 (median 79 words), rules v1 54/60 (median 35).

All three runs together: brief 77/180, rules v1 161/180.

## v2 (2026-11-03)
`rules-v2` in `runs/` (VOICE.md pulled from DESIGN.md: the "more than three" list rule and named file names):
54/60 passed, median 36 words. Links or file names: 0 (v1: 5 across 180). Long sentences: 6, all the same shape, e.g.
"The three I'd start with are the rescue platform, one system across three live apps; testing her design system on
Claude, with two hundred forty page builds; and her Nike retail brand programs." Claude followed the list rule every
time (count, three, offer the rest) but described each item inside the same sentence. Candidate v3: name items in a
few words, and give any description its own sentence. Before changing DESIGN.md again, freeze the v2 text as
VOICE-v2.md and point the rules-v2 group at it, as was done for v1. Run 2's five rules failures were all long lists (the checks, the
case studies, the résumé), the same pattern as run 1.

- Telling Claude a reply will be heard was enough to keep markdown out (0 in both groups), but not to keep it short.
- All 8 v1 failures came from two places. Six were long lists said as one sentence ("Seven checks run on every build:
  text contrast, tokens only...", "There are four case studies. A rescue platform... and a field app"): the list rule
  ("say a list as a sentence") pulled against the 25-word sentence rule. Two read "DESIGN.md" aloud.
- v2 (DESIGN.md, 2026-11-03): more than three items, say how many, name three, offer the rest; and file names and site
  addresses are named, not read. `npm run eval:voice` now runs only the 60 rules-v2 replies (the rest are kept).

## v3 (2026-11-03)
`rules-v3` in `runs/` (VOICE.md pulled from DESIGN.md: the list rule now ends "Name each item in a few words; if an
item needs a description, give it its own sentence."): **60/60 passed**, median 35 words, no rule broken. Example (the
case studies question): "She has four case studies. The three I'd start with are the rescue platform, the design
system test on Claude, and the retail brand programs. Want the details on those, or the fourth one?"

Path: brief 77/180 (three runs) → v1 161/180 (three runs) → v2 54/60 → v3 60/60. Before changing the rules again,
freeze v3 as VOICE-v3.md and point rules-v3 at it.
