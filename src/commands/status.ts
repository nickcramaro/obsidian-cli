import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

const CURRENT_VERSION = "0.1.2";

async function checkForUpdates(): Promise<string | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/nickcramaro/obsidian-cli/releases/latest",
      { headers: { "User-Agent": "obsidian-cli" } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const latest = data.tag_name?.replace(/^v/, "");
    if (latest && latest !== CURRENT_VERSION) {
      return latest;
    }
    return null;
  } catch {
    return null;
  }
}

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Check connection to Obsidian")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const [status, updateAvailable] = await Promise.all([
          client.getStatus(),
          checkForUpdates(),
        ]);

        const json = program.opts().json;

        if (json) {
          print({ ...status, updateAvailable }, { json: true });
        } else {
          console.log(`Connected to ${status.service}`);
          console.log(`Obsidian version: ${status.versions.obsidian}`);
          console.log(`Plugin version: ${status.versions.self}`);
          console.log(`Authenticated: ${status.authenticated ? "Yes" : "No"}`);

          if (updateAvailable) {
            console.log(`\nUpdate available: v${updateAvailable} (current: v${CURRENT_VERSION})`);
            console.log(`Run 'obsidian update' to install`);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
