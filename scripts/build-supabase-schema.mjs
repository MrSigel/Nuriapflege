import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const outputFile = join(process.cwd(), "supabase", "schema.sql");

const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

const body = files
  .map((file) => {
    const sql = readFileSync(join(migrationsDir, file), "utf8").trim();
    return `-- ${file}\n${sql}\n`;
  })
  .join("\n");

writeFileSync(
  outputFile,
  `-- Nuria Pflege Supabase Schema\n-- Generated from supabase/migrations in chronological order.\n\n${body}`,
);

console.log(`Supabase schema bundle written: supabase/schema.sql (${files.length} migrations)`);
