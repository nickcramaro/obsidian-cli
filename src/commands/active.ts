import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerActiveCommand(program: Command): void {
  const active = program
    .command("active")
    .description("Manage the currently active file in Obsidian");

  active
    .command("read")
    .description("Read the currently active file")
    .option("--metadata", "Include frontmatter and metadata")
    .action(async (options: { metadata?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getActiveFile(format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("update [content]")
    .description("Update the currently active file")
    .option("-f, --file <file>", "Read content from file")
    .action(async (content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.updateActiveFile(body);
        const json = program.opts().json;
        print(json ? { success: true } : "Updated active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("delete")
    .description("Delete the currently active file")
    .action(async () => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.deleteActiveFile();
        const json = program.opts().json;
        print(json ? { success: true } : "Deleted active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("append <content>")
    .description("Append content to the currently active file")
    .action(async (content: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.appendToActiveFile(content);
        const json = program.opts().json;
        print(json ? { success: true } : "Appended to active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  active
    .command("patch <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .action(async (content: string, options: {
      target: string;
      type: string;
      operation: string;
    }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        await client.patchActiveFile(content, patchOptions);
        const json = program.opts().json;
        print(json ? { success: true } : "Patched active file", { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
