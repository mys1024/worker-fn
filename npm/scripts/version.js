import { readFileSync, writeFileSync } from "node:fs";

const denoJson = JSON.parse(
  readFileSync("./deno.json", { encoding: "utf-8" }),
);
const packageJson = JSON.parse(
  readFileSync("./package.json", { encoding: "utf-8" }),
);

packageJson.version = denoJson.version;

writeFileSync("./package.json", JSON.stringify(packageJson, undefined, 2));
