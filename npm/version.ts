import denoJson from "../deno.json" with { type: "json" };
import packageJson from "./package.json" with { type: "json" };

packageJson.version = denoJson.version;

const encoder = new TextEncoder();
Deno.writeFileSync(
  new URL("./package.json", import.meta.url),
  encoder.encode(JSON.stringify(packageJson, undefined, 2)),
);
