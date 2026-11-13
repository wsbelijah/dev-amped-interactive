// Generates src/knowledge.js from ../knowledge.md so the markdown file stays
// the single source of truth for what the chat assistant knows.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(`${here}/../knowledge.md`, "utf8");
mkdirSync(`${here}/src`, { recursive: true });
writeFileSync(
  `${here}/src/knowledge.js`,
  `// GENERATED from ../knowledge.md by gen-knowledge.mjs — do not edit by hand.\nexport const KNOWLEDGE = ${JSON.stringify(md)};\n`
);
console.log("knowledge.js written:", md.length, "chars");
