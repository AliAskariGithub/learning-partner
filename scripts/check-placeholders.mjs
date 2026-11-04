#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['src/config', 'content', 'src/app'];
const PLACEHOLDER_REGEX = /\[\[CONFIRM:\s*([^\]]+)\]\]/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, index) => {
    let match;
    while ((match = PLACEHOLDER_REGEX.exec(line)) !== null) {
      matches.push({
        file: path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'),
        line: index + 1,
        placeholder: match[0],
        topic: match[1].trim(),
      });
    }
  });

  return matches;
}

function walkDir(dir) {
  const absDir = path.resolve(ROOT_DIR, dir);
  if (!fs.existsSync(absDir)) return [];

  const files = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (/\.(ts|tsx|js|mjs|md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function findPlaceholders() {
  const allMatches = [];
  for (const dir of TARGET_DIRS) {
    const files = walkDir(dir);
    for (const f of files) {
      allMatches.push(...scanFile(f));
    }
  }
  return allMatches;
}

// CLI Execution
if (process.argv[1] && process.argv[1].endsWith('check-placeholders.mjs')) {
  const placeholders = findPlaceholders();

  if (placeholders.length === 0) {
    console.log('\x1b[32m✔ No unresolved [[CONFIRM: ...]] placeholders found.\x1b[0m');
    process.exit(0);
  }

  console.log('\n\x1b[33m====================================================================\x1b[0m');
  console.log('\x1b[1;33m⚠️  ATTENTION: UNRESOLVED CONFIGURATION PLACEHOLDERS DETECTED\x1b[0m');
  console.log('\x1b[33m====================================================================\x1b[0m');
  console.log(
    `Found \x1b[1m${placeholders.length}\x1b[0m item(s) in configuration & content that require human verification before production launch:\n`
  );

  placeholders.forEach((p, idx) => {
    console.log(` ${idx + 1}. \x1b[36m${p.file}:${p.line}\x1b[0m`);
    console.log(`    Placeholder: \x1b[33m${p.placeholder}\x1b[0m`);
    console.log(`    Topic:       ${p.topic}\n`);
  });

  console.log(
    '\x1b[90mRule: Never invent values to fill these gaps. Replace them with verified legal or organizational details.\x1b[0m\n'
  );

  if (process.argv.includes('--strict')) {
    process.exit(1);
  } else {
    // Normal check prints warning and exits 0 so CI/build can output loud notice
    process.exit(0);
  }
}

