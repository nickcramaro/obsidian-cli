import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";

export function registerCommandsCommand(program: Command): void {
  const commands = program
    .command("commands")
    .description("List and execute Obsidian commands");

  commands
    .command("list")
    .description("List all available commands")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const commandList = await client.getCommands();
        const json = program.opts().json;

        if (json) {
          print(commandList, { json: true });
        } else {
          for (const cmd of commandList) {
            console.log(`${cmd.id}: ${cmd.name}`);
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });

  commands
    .command("exec <commandId>")
    .description("Execute a command by ID")
    .action(async (commandId: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.executeCommand(commandId);
        const json = program.opts().json;
        print(json ? { success: true, commandId } : `Executed: ${commandId}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
