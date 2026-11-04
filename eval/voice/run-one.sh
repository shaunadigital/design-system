#!/bin/bash
# Voice eval (2026-11-03): one spoken reply.
# usage: run-one.sh <brief|rules|rules-v2|rules-v3> <question index 0-11> <n>
#   brief    = FACTS.md only (the prompt says the reply will be read aloud)
#   rules    = FACTS.md + VOICE.md from VOICE-v1.md (the rules as first tested, frozen 2026-11-03)
#   rules-v2 = FACTS.md + VOICE.md from VOICE-v2.md (frozen 2026-11-03)
#   rules-v3 = FACTS.md + VOICE.md pulled from DESIGN.md at run time (the current rules)
# Output: eval/voice/runs/<group>/<q>/<n>/ (reply.txt, prompt.txt, session.json, timing.json)
set -u
E=$(cd "$(dirname "$0")" && pwd); g=$1; q=$2; n=$3
dir=$E/runs/$g/$q/$n
[ -f "$dir/reply.txt" ] && exit 0
rm -rf "$dir"; mkdir -p "$dir"; cp "$E/FACTS.md" "$dir/"
if [ "$g" = rules ]; then cp "$E/VOICE-v1.md" "$dir/VOICE.md"; fi
if [ "$g" = rules-v2 ]; then cp "$E/VOICE-v2.md" "$dir/VOICE.md"; fi
if [ "$g" = rules-v3 ]; then
  { echo "# Voice rules: follow these for every spoken reply"; echo; awk '/^### Spoken replies/{f=1;next} /^#/{f=0} f && /^- /' "$E/../../DESIGN.md"; } > "$dir/VOICE.md"
fi
ques=$(node -e "console.log(require('$E/questions.json')[$q])")
prompt="A visitor on shauna.dev asked the site's voice assistant, out loud: \"$ques\" Your answer will be read aloud by a text-to-speech engine, not shown on a screen. Read every file in this folder first and follow it. Write only the words to be spoken, nothing else, to a file named reply.txt in this folder."
echo "$prompt" > "$dir/prompt.txt"
T=""; command -v timeout >/dev/null && T="timeout 600"; [ -z "$T" ] && command -v gtimeout >/dev/null && T="gtimeout 600"
cd "$dir"; start=$(date +%s)
$T claude --safe-mode -p "$prompt" --model "${MODEL:-claude-sonnet-5-5}" --tools "Read,Write,Glob" --permission-mode acceptEdits --max-turns 8 --no-session-persistence --output-format json > session.json 2> session.err
echo "{\"seconds\": $(( $(date +%s) - start ))}" > timing.json
[ -f reply.txt ] && echo "done $g $q $n" || echo "MISSING $g $q $n"
