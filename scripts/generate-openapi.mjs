/**
 * Generate client TypeScript types from the single source of truth OpenAPI spec.
 *
 * Source  : .opencode/artifacts/ehos/G1-ARCH/openapi.yaml (atau $OPENAPI_SPEC)
 * Output  : src/lib/api/openapi.d.ts
 *
 * Konstrain ARD-003: client admin WAJIB generate dari spec kontrak — tidak ada
 * shared package. Jalankan ulang bila kontrak berubah.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const specEnv = process.env.OPENAPI_SPEC;
const specCandidates = specEnv
  ? [specEnv]
  : [
      path.resolve(__dirname, "../../.opencode/artifacts/ehos/G1-ARCH/openapi.yaml"),
      path.resolve(__dirname, "../openapi.yaml"),
      path.resolve(__dirname, "../openapi.json"),
    ];

const specPath = specCandidates.find((p) => fs.existsSync(p));
if (!specPath) {
  console.error("OpenAPI spec tidak ditemukan. Coba set OPENAPI_SPEC=<path>");
  process.exit(1);
}

const outputPath = path.resolve(__dirname, "../src/lib/api/openapi.d.ts");

const { default: openapiTS, astToString } = await import("openapi-typescript");

console.log(`[gen-api] membaca spec: ${specPath}`);
const raw = await readFile(specPath, "utf8");
const spec = specPath.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);

const result = await openapiTS(spec);
const typeDefs = astToString(result);

await writeFile(outputPath, `// GENERATED — dari ${path.basename(specPath)}. Jangan edit manual.\n// Regenerasi: npm run gen:api\n${typeDefs}`, "utf8");

console.log(`[gen-api] selesai → ${outputPath}`);