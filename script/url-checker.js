#!/usr/bin/env node
/* Checks that every http(s) URL found in markdown files under a directory is reachable. */
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const opts = { timeout: 5, directory: "src/posts" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "-t" || argv[i] === "--timeout") opts.timeout = Number(argv[++i]);
    else if (argv[i] === "-d" || argv[i] === "--directory") opts.directory = argv[++i];
  }
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) {
    throw new Error("timeout must be a positive number of seconds");
  }
  return opts;
}

function findMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMarkdown(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

async function check(url, timeoutSeconds) {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutSeconds * 1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const { timeout, directory } = parseArgs(process.argv.slice(2));
  const urls = new Set();
  for (const file of findMarkdown(directory)) {
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/https?:\/\/[^\s)>\]"']+/g)) urls.add(m[0]);
  }

  const results = await Promise.all(
    [...urls].map(async (url) => ({ url, ok: await check(url, timeout) }))
  );
  const broken = results.filter((r) => !r.ok);
  results.forEach((r) => console.log(`${r.ok ? "OK  " : "FAIL"} ${r.url}`));

  if (broken.length > 0) {
    console.error(`${broken.length} broken URL(s)`);
    process.exit(1);
  }
  console.log(`Checked ${results.length} URL(s)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
