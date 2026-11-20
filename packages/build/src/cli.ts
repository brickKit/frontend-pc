// pnpm compose: reads the baseline (BE_BASELINE, or baseline/standard.yaml) and every modules/*/package.json, writes
// packages/shell/src/modules.generated.ts and prints what went in and what was left out (FP03).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { compose, generated, parseBaseline, type Candidate } from "./compose.ts";

const root = resolve(import.meta.dirname, "../../..");
const baselineFile = process.env.BE_BASELINE ?? "baseline/standard.yaml";
const baseline = parseBaseline(parse(readFileSync(resolve(root, baselineFile), "utf8")));
const candidates: Candidate[] = [];
const dir = join(root, "modules");
for (const name of existsSync(dir) ? readdirSync(dir) : []) {
  const pkg = join(dir, name, "package.json");
  if (!existsSync(pkg)) continue;
  const declared = JSON.parse(readFileSync(pkg, "utf8")).bePageModule;
  if (!declared) throw new Error(`modules/${name}/package.json has no bePageModule`);
  candidates.push({ name, declared });
}
const c = compose(baseline, candidates);
writeFileSync(join(root, "packages/shell/src/modules.generated.ts"), generated(c, baselineFile));
for (const m of c.included) console.log(`in   ${m.name} (${m.component} ${m.version})`);
for (const m of c.excluded) console.log(`out  ${m.name}: ${m.reason}`);
