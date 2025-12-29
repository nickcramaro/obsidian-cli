import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerOpenCommand(program: Command): void {
  program
    .command("open <path>")
    .description("Open a file in Obsidian")
    .option("--new-leaf", "Open in a new leaf/tab")
    .action(async (path: string, options: { newLeaf?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.openFile(path, options.newLeaf);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Opened: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
