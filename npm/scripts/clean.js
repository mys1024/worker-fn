import { readFileSync, rmSync, writeFileSync } from "node:fs";

// clean the version from package.json
const packageJson = JSON.parse(
  readFileSync(resolve("../package.json"), { encoding: "utf-8" }),
);
packageJson.version = "0.0.0";
writeFileSync(
  resolve("../package.json"),
  JSON.stringify(packageJson, null, 2) + "\n",
  { encoding: "utf-8" },
);

// clean files
const files = ["../src", "../README.md", "../LICENSE"];
for (const file of files) {
  rmSync(resolve(file), { recursive: true, force: true });
}

/**
 * Resolve a path relative to the current module.
 * @param {string} path
 */
function resolve(path) {
  return new URL(path, import.meta.url);
}
