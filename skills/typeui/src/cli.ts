#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import {
  promptDesignSystem,
  promptDesignSystemFields,
  promptDesignSystemUpdates,
  promptProviders,
  promptSkillMetadata
} from "./prompts/designSystem";
import { promptRegistrySpecSelection } from "./prompts/registry";
import { RegistrySlugSchema } from "./domain/designSystemSchema";
import { loadExistingDesignSystem } from "./generation/existingDesignSystem";
import { runGeneration } from "./generation/runGeneration";
import { runPull } from "./generation/runPull";
import { listRegistrySpecs, pullSkillMarkdown } from "./registry/registryClient";
import { ALWAYS_INCLUDED_PROVIDERS, DesignSystemInput, Provider, SUPPORTED_PROVIDERS } from "./types";
import { printBanner } from "./ui/banner";
import { buildDefaultSkillMetadata } from "./skillMetadata";

function parseProviderOption(raw?: string): Provider[] | null {
  if (!raw) {
    return null;
  }
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) {
    return null;
  }

  const invalid = values.filter((provider) => !SUPPORTED_PROVIDERS.includes(provider as Provider));
  if (invalid.length > 0) {
    throw new Error(
      `Unsupported providers: ${invalid.join(", ")}. Supported: ${SUPPORTED_PROVIDERS.join(", ")}.`
    );
  }

  return values as Provider[];
}

function printResults(mode: "generated" | "updated" | "preview" | "pulled", results: Array<{ filePath: string; changed: boolean }>) {
  console.log("");
  for (const result of results) {
    const state = result.changed ? mode : "unchanged";
    console.log(`${state}: ${path.relative(process.cwd(), result.filePath) || result.filePath}`);
  }
}

async function generateLike(
  action: "generate" | "update",
  mode: "generated" | "updated" | "preview",
  options: { providers?: string; dryRun?: boolean }
) {
  const selectedProviders = parseProviderOption(options.providers) ?? (await promptProviders());
  const providers = [...new Set<Provider>([...ALWAYS_INCLUDED_PROVIDERS, ...selectedProviders])];
  let designSystem: DesignSystemInput;
  let metadata = buildDefaultSkillMetadata("typeui.sh");

  if (action === "update") {
    const existing = await loadExistingDesignSystem(process.cwd(), providers);
    if (!existing) {
      throw new Error(
        "No existing managed design system found for the selected providers. Run `typeui.sh generate` first."
      );
    }

    metadata = await promptSkillMetadata(existing.metadata);
    const fields = await promptDesignSystemFields();
    const updates = await promptDesignSystemUpdates(existing.designSystem, fields);
    designSystem = { ...existing.designSystem, ...updates };
  } else {
    designSystem = await promptDesignSystem("typeui.sh");
    metadata = await promptSkillMetadata(buildDefaultSkillMetadata(designSystem.productName));
  }

  const results = await runGeneration({
    projectRoot: process.cwd(),
    providers,
    designSystem,
    metadata,
    dryRun: Boolean(options.dryRun)
  });
  printResults(mode, results);
}

async function pullLike(slug: string, options: { providers?: string; dryRun?: boolean }) {
  const parsedSlug = RegistrySlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    throw new Error(parsedSlug.error.issues[0]?.message ?? "Invalid slug.");
  }
  const selectedProviders = parseProviderOption(options.providers) ?? (await promptProviders());
  const providers = [...new Set<Provider>([...ALWAYS_INCLUDED_PROVIDERS, ...selectedProviders])];
  const pullResult = await pullSkillMarkdown(parsedSlug.data);
  if (!pullResult.ok) {
    throw new Error(`Registry pull failed: ${pullResult.reason}`);
  }
  const results = await runPull({
    projectRoot: process.cwd(),
    providers,
    markdown: pullResult.markdown,
    dryRun: Boolean(options.dryRun)
  });
  printResults(options.dryRun ? "preview" : "pulled", results);
}

async function listLike(options: { providers?: string; dryRun?: boolean }) {
  const specsResult = await listRegistrySpecs();
  if (!specsResult.ok) {
    throw new Error(`Registry specs failed: ${specsResult.reason}`);
  }

  if (specsResult.specs.length === 0) {
    console.log("No registry specs available.");
    return;
  }

  const selectableSpecs = specsResult.specs.filter((spec) => spec.hasSkillMd);
  if (selectableSpecs.length === 0) {
    throw new Error("No pullable registry specs available.");
  }

  const selected = await promptRegistrySpecSelection(specsResult.specs);
  await pullLike(selected.slug, options);
}

const program = new Command();

const hasNoArgs = process.argv.length <= 2;
const wantsHelp = process.argv.includes("--help") || process.argv.includes("-h");
if (hasNoArgs || wantsHelp) {
  printBanner();
}

program
  .name("typeui.sh")
  .description("Generate and update design-system skill markdown files for AI providers.")
  .version("0.1.0");

program.hook("preAction", () => {
  printBanner();
});

program
  .command("generate")
  .description("Generate provider skill files in the current project.")
  .option("-p, --providers <providers>", "Comma-separated providers")
  .option("--dry-run", "Preview file changes without writing")
  .action(async (options) => {
    await generateLike("generate", options.dryRun ? "preview" : "generated", options);
  });

program
  .command("update")
  .description("Update existing provider skill files in the current project.")
  .option("-p, --providers <providers>", "Comma-separated providers")
  .option("--dry-run", "Preview file changes without writing")
  .action(async (options) => {
    await generateLike("update", options.dryRun ? "preview" : "updated", options);
  });

program
  .command("pull <slug>")
  .description("Pull a registry skill by slug and write selected provider files.")
  .option("-p, --providers <providers>", "Comma-separated providers")
  .option("--dry-run", "Preview file changes without writing")
  .action(async (slug, options) => {
    await pullLike(slug, options);
  });

program
  .command("list")
  .description("List available registry design system specs.")
  .option("-p, --providers <providers>", "Comma-separated providers")
  .option("--dry-run", "Preview file changes without writing")
  .action(async (options) => {
    await listLike(options);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`typeui.sh error: ${message}`);
  process.exitCode = 1;
});
