#!/usr/bin/env node
/**
 * Parse GITHUB_ISSUES.md and create GitHub issues via the REST API.
 *
 * Usage:
 *   node scripts/create-github-issues.mjs              # create issues
 *   node scripts/create-github-issues.mjs --dry-run    # preview only
 *
 * Requires GITHUB_TOKEN env var (classic token with `repo` scope).
 * Repo is inferred from `git remote` or set manually below.
 */

import { readFileSync } from "node:fs";

const REPO = "rahulvijay81/recurb";
const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN;
const DRY_RUN = process.argv.includes("--dry-run");
const START_INDEX = parseInt(process.argv.find(a => a.startsWith("--start="))?.split("=")[1] || "0");
const END_INDEX = parseInt(process.argv.find(a => a.startsWith("--end="))?.split("=")[1] || "999");

function parseIssues(path) {
  const text = readFileSync(path, "utf-8").replace(/\r/g, "");
  const blocks = text.split(/\n(?=###\s+\[)/);

  return blocks
    .filter((b) => /^###\s+\[/.test(b.trim()))
    .map((block) => {
      const lines = block.trim().split("\n");
      const titleLine = lines[0];
      const titleMatch = titleLine.match(/^###\s+\[(\w+)\]\s+(.+)$/);
      if (!titleMatch) return null;
      const type = titleMatch[1];
      const title = `[${type}] ${titleMatch[2].trim()}`;
      const labelLine = lines.find((l) => l.startsWith("**Labels:**"));
      const labels = labelLine
        ? labelLine.replace("**Labels:**", "").split(",").map((l) => l.trim().replace(/`/g, ""))
        : [];

      const labelIdx = lines.indexOf(labelLine);
      const bodyStart = lines.slice(labelIdx + 1).findIndex((l) => l.trim() !== "") + labelIdx + 1;
      // Stop at the next "---" separator (end of this issue block)
      const bodyEnd = lines.findIndex((l, i) => i >= bodyStart && l.trim() === "---");
      const bodyLines = bodyEnd > bodyStart ? lines.slice(bodyStart, bodyEnd) : lines.slice(bodyStart);
      const body = bodyLines.join("\n").trim();

      // Add "help wanted" to all issues unless already present
      if (!labels.includes("help wanted") && !labels.includes("help-wanted")) {
        labels.push("help wanted");
      }
      return { title, labels, body };
    })
    .filter(Boolean);
}

if (!TOKEN && !DRY_RUN) {
  console.error("ERROR: GITHUB_TOKEN env var required.");
  console.error("  Export it: export GITHUB_TOKEN=ghp_...");
  console.error("  Or use --dry-run to preview.");
  process.exit(1);
}

const issues = parseIssues("GITHUB_ISSUES.md");
console.log(`Found ${issues.length} issues.\n`);

const labelMap = {
  bug: "bug",
  security: "security",
  api: "api",
  auth: "auth",
  database: "database",
  ui: "ui",
  "user-flow": "user flow",
  admin: "admin",
  performance: "performance",
  subscriptions: "subscriptions",
  critical: "critical",
};

async function main() {
  let created = 0;
  for (let i = 0; i < issues.length; i++) {
    if (i < START_INDEX || i > END_INDEX) continue;
    const { title, labels, body } = issues[i];
    const githubLabels = labels
      .map((l) => labelMap[l] || l)
      .filter(Boolean);

    const payload = { title, body, labels: githubLabels };

    console.log(`[${i + 1}/${issues.length}] ${title}`);
    console.log(`  Labels: ${githubLabels.join(", ")}`);
    if (DRY_RUN) {
      console.log(`  Body: ${body.slice(0, 100)}...\n`);
      continue;
    }

    const res = await fetch(`${API}/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`  ✅ Created: ${data.html_url}`);
    } else {
      console.error(`  ❌ Failed (${res.status}): ${data.message}`);
      if (data.errors) console.error(`     ${JSON.stringify(data.errors)}`);
    }
    console.log();
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
