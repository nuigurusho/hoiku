import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const build = (process.env.PWA_BUILD_ID || process.env.GITHUB_SHA || "local-dev").slice(0, 40);
const excludedDirs = new Set([".git", ".github", ".codex-remote-attachments", "design", "notes", "tmp", "tools", "node_modules"]);
const excludedFiles = new Set([
  ".gitignore", "CLAUDE.md", "README.md", "serve.bat", "serve.sh", "pwa-build.js", "sw.js",
  "assets/logo-original.png",
]);
const publicExts = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".woff2", ".webmanifest"]);

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replaceAll(path.sep, "/");
    if (entry.isDirectory()) await walk(full, out);
    else if (!excludedFiles.has(rel) && publicExts.has(path.extname(rel).toLowerCase())) out.push(`./${rel}`);
  }
  return out;
}

const assets = await walk(root);
assets.push("./");
assets.sort((a, b) => a.localeCompare(b, "en"));

const output = [
  "/* 自動生成: tools/build-pwa.mjs を実行して更新する。 */",
  `self.HOIKU_PWA_BUILD = ${JSON.stringify(build)};`,
  `self.HOIKU_PWA_ASSETS = ${JSON.stringify(assets, null, 2)};`,
  "",
].join("\n");

await fs.writeFile(path.join(root, "pwa-build.js"), output, "utf8");
console.log(`PWA build ${build}: ${assets.length} files`);
