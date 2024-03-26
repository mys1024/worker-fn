import { cpSync, readFileSync, writeFileSync } from "node:fs";

// prepare the version for package.json
const denoJson = JSON.parse(
  readFileSync(resolve("../../deno.json"), { encoding: "utf-8" }),
);
const packageJson = JSON.parse(
  readFileSync(resolve("../package.json"), { encoding: "utf-8" }),
);
packageJson.version = denoJson.version;
writeFileSync(
  resolve("../package.json"),
  JSON.stringify(packageJson, null, 2) + "\n",
  { encoding: "utf-8" },
);

// prepare files
const files = ["../../src", "../../README.md", "../../LICENSE"];
for (const file of files) {
  cpSync(resolve(file), resolve(file.slice(3)), {
    recursive: true,
    force: true,
  });
}

/**
 * Resolve a path relative to the current module.
 * @param {string} path
 */
function resolve(path) {
  return new URL(path, import.meta.url);
}
