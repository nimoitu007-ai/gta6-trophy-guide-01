// Leonida Trophy Ledger — the gta6-trophy-guide-01 entry program (Node 22,
// standard library only). The guide itself is plain static files under app/
// (index.html, app.js, style.css, data/trophies.json): no build step, and it
// loads nothing over the network. This program hands the entry in: it reads
// the trophy file, refuses to hand in a list that is short, has a blank
// guide, names a source nowhere, repeats a slug or carries a bad grade, then
// copies app/ and screenshots/ from beside this file into the output
// directory (clearing any stale copy first, so a second run writes exactly
// the same bytes), and writes dossier.json with buildDossier from the
// vendored make.fun library. Leave vendor/makefun-frontend.ts as it is: the
// scorer requires dossier.json to be byte for byte what its own copy of that
// library writes.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const TROPHY_TOTAL = 55;
const GRADES = new Set(['platinum', 'gold', 'silver', 'bronze']);

// Read the trophy file and check it before anything is handed in: a broken
// data file should fail loudly here instead of silently submitting a
// partial guide.
const trophyDoc = JSON.parse(readFileSync(join(repoRoot, 'app', 'data', 'trophies.json'), 'utf-8'));
const trophyList = trophyDoc.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== TROPHY_TOTAL) {
  throw new Error(`trophies.json must hold ${TROPHY_TOTAL} trophies, found ${trophyList?.length ?? 0}`);
}
const seenSlugs = new Set();
const problems = [];
for (const trophy of trophyList) {
  if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
    problems.push(`${trophy.name}: no guide`);
  }
  if (typeof trophy.source !== 'string' || trophy.source.trim() === '') {
    problems.push(`${trophy.name}: no source named`);
  }
  if (!GRADES.has(trophy.grade)) {
    problems.push(`${trophy.name}: bad grade ${JSON.stringify(trophy.grade)}`);
  }
  if (typeof trophy.slug !== 'string' || trophy.slug === '' || seenSlugs.has(trophy.slug)) {
    problems.push(`${trophy.name}: missing or repeated slug`);
  }
  seenSlugs.add(trophy.slug);
}
if (problems.length > 0) {
  throw new Error(`trophies.json failed validation:\n- ${problems.join('\n- ')}`);
}

mkdirSync(outputDir, { recursive: true });

// Clear the previous run's output first: without this, a file removed from
// the repository would survive in the output and two runs could disagree.
for (const name of ['app', 'screenshots', 'dossier.json']) {
  rmSync(join(outputDir, name), { recursive: true, force: true });
}
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of
// app files, counted beside /output's own 1000-entry cap with screenshots/
// and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(
  `handed in ${trophyList.length} trophies, dossier ${statSync(join(outputDir, 'dossier.json')).size} bytes -> ${outputDir}`,
);
