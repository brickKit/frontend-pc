#!/usr/bin/env bash
# Each lint rule of this repository is red on its violating sample (the testing rules: a check proves it can fail).
# scripts/lint-samples/ holds one file breaking every rule; eslint must name each rule, check-styles must fail.
set -u
cd "$(dirname "$0")/.."
out=$(npx eslint --no-ignore --rule '{}' scripts/lint-samples/modules/sample/Bad.vue 2>&1)
miss=0
for rule in vue/component-api-style no-restricted-imports vue/no-bare-strings-in-template; do
  grep -q "$rule" <<<"$out" || { echo "not red: $rule"; miss=1; }
done
node scripts/check-styles.mjs scripts/lint-samples >/dev/null 2>&1 && { echo "not red: check-styles"; miss=1; }
[ $miss = 0 ] && echo "every lint rule is red on its sample"
exit $miss
