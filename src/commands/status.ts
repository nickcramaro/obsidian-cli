import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Check connection to Obsidian")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const status = await client.getStatus();

        const json = program.opts().json;

        if (json) {
          print(status, { json: true });
        } else {
          console.log(`Connected to ${status.service}`);
          console.log(`Obsidian version: ${status.versions.obsidian}`);
          console.log(`Plugin version: ${status.versions.self}`);
          console.log(`Authenticated: ${status.authenticated ? "Yes" : "No"}`);
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
