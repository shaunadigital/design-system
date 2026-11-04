#!/bin/bash
# Voice eval runner: 12 questions x 5 replies x 4 groups = 240 replies, then scores them.
# Finished replies are skipped, so after the first run only the newest group (60 replies) runs.
# Run from the repo root on a Mac where `claude` is signed in (the same way as eval/round2.sh):
#   bash eval/voice/run.sh          (3 at a time; P=4 bash eval/voice/run.sh for 4)
#   bash eval/voice/run.sh --dry    (list the jobs without running them)
# Safe to stop and re-run: finished replies are skipped.
set -u
E=$(cd "$(dirname "$0")" && pwd)
P=${P:-3}; N=${N:-5}; GROUPS_=${GROUPS_:-"brief rules rules-v2 rules-v3"}
jobs() { for q in $(seq 0 11); do for g in $GROUPS_; do for n in $(seq 1 $N); do echo "$g $q $n"; done; done; done; }
if [ "${1:-}" = --dry ]; then jobs | head -4; echo "... $(jobs | wc -l | tr -d ' ') replies in all"; exit 0; fi
jobs | xargs -P "$P" -L 1 bash "$E/run-one.sh"
echo "finished: $(find "$E/runs" -name reply.txt | wc -l | tr -d ' ') of $(jobs | wc -l | tr -d ' ') replies"
node "$E/score.mjs"
