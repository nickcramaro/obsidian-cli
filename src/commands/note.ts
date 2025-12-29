import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerNoteCommand(program: Command): void {
  const note = program
    .command("note")
    .description("Manage vault notes");

  note
    .command("read <path>")
    .description("Read a note from the vault")
    .option("--metadata", "Include frontmatter and metadata")
    .action(async (path: string, options: { metadata?: boolean }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getFile(path, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("create <path> [content]")
    .description("Create a new note")
    .option("-f, --file <file>", "Read content from file")
    .action(async (path: string, content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.createFile(path, body);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Created: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("update <path> [content]")
    .description("Update an existing note")
    .option("-f, --file <file>", "Read content from file")
    .action(async (path: string, content?: string, options?: { file?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        await client.updateFile(path, body);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Updated: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("delete <path>")
    .description("Delete a note")
    .action(async (path: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.deleteFile(path);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Deleted: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("append <path> <content>")
    .description("Append content to a note")
    .action(async (path: string, content: string) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        await client.appendToFile(path, content);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Appended to: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  note
    .command("patch <path> <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location (heading name, block ID, or frontmatter field)")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .action(async (path: string, content: string, options: {
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

        await client.patchFile(path, content, patchOptions);
        const json = program.opts().json;
        print(json ? { success: true, path } : `Patched: ${path}`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}
