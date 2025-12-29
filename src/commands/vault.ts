import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerVaultCommand(program: Command): void {
  const vault = program
    .command("vault")
    .description("Browse vault files and directories");

  vault
    .command("list [path]")
    .description("List files in a directory")
    .action(async (path?: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const files = await client.listDirectory(path);
        const json = program.opts().json;

        if (json) {
          print(files, { json: true });
        } else {
          for (const file of files) {
            console.log(file);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
