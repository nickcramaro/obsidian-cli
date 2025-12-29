import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import type { Period, PatchOptions } from "../types";

const VALID_PERIODS: Period[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];

export function registerPeriodicCommand(program: Command): void {
  const periodic = program
    .command("periodic <period>")
    .description("Manage periodic notes (daily, weekly, monthly, quarterly, yearly)");

  periodic
    .command("read")
    .description("Read the current periodic note")
    .option("--metadata", "Include frontmatter and metadata")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { metadata?: boolean; date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        const format = options.metadata ? "json" : "markdown";
        const content = await client.getPeriodicNote(period, date, format);
        const json = program.opts().json;
        print(content, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("append <content>")
    .description("Append content to the periodic note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content: string, options: { date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.appendToPeriodicNote(period, content, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Appended to ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("update [content]")
    .description("Update the periodic note")
    .option("-f, --file <file>", "Read content from file")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (content?: string, options?: { file?: string; date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        let body = content || "";
        if (options?.file) {
          body = await Bun.file(options.file).text();
        }

        const date = options?.date ? parseDate(options.date) : undefined;
        await client.updatePeriodicNote(period, body, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Updated ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
    .command("delete")
    .description("Delete the periodic note")
    .option("--date <date>", "Specific date (YYYY-MM-DD)")
    .action(async (options: { date?: string }) => {
      try {
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const date = options.date ? parseDate(options.date) : undefined;
        await client.deletePeriodicNote(period, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Deleted ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });

  periodic
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
        const period = validatePeriod(periodic.args[0]);
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);

        const patchOptions: PatchOptions = {
          target: options.target,
          targetType: options.type as PatchOptions["targetType"],
          operation: options.operation as PatchOptions["operation"],
        };

        const date = options.date ? parseDate(options.date) : undefined;
        await client.patchPeriodicNote(period, content, patchOptions, date);
        const json = program.opts().json;
        print(json ? { success: true } : `Patched ${period} note`, { json });
      } catch (error) {
        exitWithError(error);
      }
    });
}

function validatePeriod(period: string): Period {
  if (!VALID_PERIODS.includes(period as Period)) {
    throw new Error(`Invalid period: ${period}. Must be one of: ${VALID_PERIODS.join(", ")}`);
  }
  return period as Period;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}
