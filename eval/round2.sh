#!/bin/bash
# Round 2 runner (2026-11-02): standard DESIGN.md (open-spec) vs the final system (with-v4),
# 12 screens x 5 builds x 2 wordings = 240 builds. Safe to stop and re-run: finished builds are skipped.
# usage: eval/round2.sh            (3 builds at a time; P=4 eval/round2.sh for 4)
#        eval/round2.sh --dry      (list the builds without running them)
set -u
E=$(cd "$(dirname "$0")" && pwd)
P=${P:-3}; N=${N:-5}; GROUPS_=${GROUPS_:-"open-spec with-v4"}
jobs() {
  for scr in $(node -e "console.log(Object.keys(require('$E/screens.json')).join(' '))"); do
    for g in $GROUPS_; do for w in same varied; do for n in $(seq 1 $N); do
      echo "$w $g $scr $n"
    done; done; done
  done
}
if [ "${1:-}" = --dry ]; then jobs | head -5; echo "... $(jobs | wc -l | tr -d ' ') builds in all"; exit 0; fi
jobs | xargs -P "$P" -L 1 bash "$E/run-round2.sh"
echo "finished: $(find "$E/round2" -name component.html | wc -l | tr -d ' ') of $(jobs | wc -l | tr -d ' ') builds"
