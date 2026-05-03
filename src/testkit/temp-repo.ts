import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "../adapters/shell/command.js";

export type TempRepo = {
  root: string;
};

export async function makeTempRepo(options: { packageJson?: Record<string, unknown> } = {}): Promise<TempRepo> {
  const root = await mkdtemp(join(tmpdir(), "sovryn-v3-"));
  await runCommand("git init -b main", root);
  await runCommand("git config user.name 'Test User'", root);
  await runCommand("git config user.email test@example.com", root);
  if (options.packageJson) {
    await writeFile(join(root, "package.json"), `${JSON.stringify(options.packageJson, null, 2)}\n`, "utf8");
  } else {
    await writeFile(join(root, "README.md"), "# temp\n", "utf8");
  }
  await runCommand("git add -A && git commit -m initial", root);
  return { root };
}
