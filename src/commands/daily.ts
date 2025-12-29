import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { PatchOptions } from "../types";

export function registerDailyCommand(program: Command): void {
  const daily = program
    .command("daily")
    .description("Manage daily notes (shortcut for periodic daily)");

  daily
    .command("read")
    .description("Read today's daily note")
    .option("--metadata", "Include frontmatter and metadata")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { metadata?: boolean; date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getPeriodicNote("daily", date, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("append <content>")
    .description("Append content to today's daily note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: { date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.appendToPeriodicNote("daily", content, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Appended to daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("update [content]")
    .description("Update today's daily note")
    .option("-f, --file <file>", "Read content from file")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content?: string, options?: { file?: string; date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        const date = options?.date ? parseDate(options.date) : undefined;
        await client.updatePeriodicNote("daily", body, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Updated daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("delete")
    .description("Delete today's daily note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { date?: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.deletePeriodicNote("daily", date);
        const json = program.opts().json;
        print(json ? { success: true } : "Deleted daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  daily
    .command("patch <content>")
    .description("Insert content relative to a heading, block, or frontmatter")
    .requiredOption("--target <target>", "Target location")
    .requiredOption("--type <type>", "Target type: heading, block, or frontmatter")
    .option("--operation <op>", "Operation: append, prepend, or replace", "append")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: {
      target: string;
      type: string;
      operation: string;
      date?: string;
    }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        const date = options.date ? parseDate(options.date) : undefined;
        await client.patchPeriodicNote("daily", content, patchOptions, date);
        const json = program.opts().json;
        print(json ? { success: true } : "Patched daily note", { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}
