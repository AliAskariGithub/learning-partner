#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

// 1. Gather all existing valid routes
function getValidRoutes() {
  const routes = new Set([
    '/',
    '/about',
    '/features',
    '/how-it-works',
    '/connect-ai',
    '/pricing',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/help',
    '/use-cases',
    '/feedback',
    '/admin/inbox',
    '/app',
    '/settings',
    '/sign-in',
    '/sign-up',
    '/cookies',
    '/forgot-password',
    '/verify',
  ]);

  // Add all Help Center article slugs
  const helpDir = path.join(ROOT_DIR, 'content', 'help');
  if (fs.existsSync(helpDir)) {
    const files = fs.readdirSync(helpDir).filter((f) => f.endsWith('.md'));
    files.forEach((f) => {
      const slug = f.replace(/\.md$/, '');
      routes.add(`/help/${slug}`);
    });
  }

  return routes;
}

// 2. Scan files for internal links
function scanDirectoryForLinks(dir) {
  const absDir = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(absDir)) return [];

  const files = [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectoryForLinks(path.join(dir, entry.name)));
    } else if (/\.(tsx|ts|jsx|js|md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function checkInternalLinks() {
  const validRoutes = getValidRoutes();
  const searchDirs = ['src/app', 'src/components', 'content'];
  const allFiles = searchDirs.flatMap(scanDirectoryForLinks);

  // Link matching regexes
  // Match href="/something" or [label](/something)
  const hrefRegex = /href=["'](\/[^"'#?]*)/g;
  const mdLinkRegex = /\[.*?\]\((\/[^)#?]*)/g;

  const brokenLinks = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativeFile = path.relative(ROOT_DIR, file).replace(/\\/g, '/');

    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      const target = match[1];
      // Ignore API endpoints, static assets
      if (
        target.startsWith('/api') ||
        target.startsWith('/_next') ||
        target.startsWith('/favicon') ||
        target.endsWith('.png') ||
        target.endsWith('.jpg') ||
        target.endsWith('.svg')
      ) {
        continue;
      }
      if (!validRoutes.has(target)) {
        brokenLinks.push({
          file: relativeFile,
          link: target,
        });
      }
    }

    while ((match = mdLinkRegex.exec(content)) !== null) {
      const target = match[1];
      if (
        target.startsWith('/api') ||
        target.startsWith('/_next') ||
        target.endsWith('.png') ||
        target.endsWith('.jpg')
      ) {
        continue;
      }
      if (!validRoutes.has(target)) {
        brokenLinks.push({
          file: relativeFile,
          link: target,
        });
      }
    }
  }

  return { validRoutes, brokenLinks };
}

if (process.argv[1] && process.argv[1].endsWith('check-internal-links.mjs')) {
  console.log('Checking internal links across all marketing pages and content...');
  const { brokenLinks } = checkInternalLinks();

  if (brokenLinks.length === 0) {
    console.log('\x1b[32m✔ All internal links resolved to valid routes successfully!\x1b[0m');
    process.exit(0);
  } else {
    console.error(`\x1b[31m✖ Found ${brokenLinks.length} broken internal link(s):\x1b[0m`);
    brokenLinks.forEach((b) => {
      console.error(`  - \x1b[36m${b.file}\x1b[0m -> \x1b[31m${b.link}\x1b[0m`);
    });
    process.exit(1);
  }
}

