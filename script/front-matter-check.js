#!/usr/bin/env node
/* Checks that every markdown page under src/ starts with front matter containing a non-empty title. */
const fs = require('fs');
const path = require('path');

function findMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMarkdown(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

const directory = process.argv[2] || 'src';
const problems = [];

for (const file of findMarkdown(directory)) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    problems.push(`${file}: missing front matter`);
  } else if (!/^title:\s*\S+/m.test(match[1])) {
    problems.push(`${file}: missing title`);
  }
}

if (problems.length > 0) {
  problems.forEach((p) => console.error(p));
  process.exit(1);
}
console.log('All markdown pages have a title');
