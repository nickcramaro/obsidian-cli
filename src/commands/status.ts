import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import { c } from "../utils/colors";

const CURRENT_VERSION = "0.1.3";

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
          console.log(`${c.green("●")} Connected to ${c.bold(status.service)}`);
          console.log(`  Obsidian: ${c.cyan(status.versions.obsidian)}`);
          console.log(`  Plugin:   ${c.cyan(status.versions.self)}`);
          console.log(`  Auth:     ${status.authenticated ? c.green("Yes") : c.red("No")}`);

          if (updateAvailable) {
            console.log();
            console.log(`${c.yellow("⬆")} Update available: ${c.bold(`v${updateAvailable}`)} ${c.dim(`(current: v${CURRENT_VERSION})`)}`);
            console.log(`  Run ${c.cyan("obsidian update")} to install`);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
