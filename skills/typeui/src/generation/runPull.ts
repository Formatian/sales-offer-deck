import { upsertManagedSkillFile } from "../io/updateSkillFile";
import { PROVIDER_DETAILS, Provider } from "../types";

export interface PullWriteOptions {
  projectRoot: string;
  providers: Provider[];
  markdown: string;
  dryRun?: boolean;
}

export interface PullWriteResult {
  filePath: string;
  changed: boolean;
}

export async function runPull(options: PullWriteOptions): Promise<PullWriteResult[]> {
  const results: PullWriteResult[] = [];
  const seenPaths = new Set<string>();

  for (const provider of options.providers) {
    const relativePath = PROVIDER_DETAILS[provider].relativePath;
    if (seenPaths.has(relativePath)) {
      continue;
    }
    seenPaths.add(relativePath);
    const result = await upsertManagedSkillFile(
      options.projectRoot,
      relativePath,
      options.markdown,
      options.dryRun ?? false
    );
    results.push({
      filePath: result.absPath,
      changed: result.changed
    });
  }

  return results;
}
