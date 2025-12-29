import { Command } from "commander";
import { getConfig } from "../config";
import { ObsidianClient } from "../client";
import { print } from "../utils/output";
import { exitWithError } from "../utils/errors";
import { c } from "../utils/colors";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search for content in the vault")
    .option("--dql", "Use Dataview DQL query instead of simple search")
    .option("--context <length>", "Context length for simple search", "100")
    .action(async (query: string, options: { dql?: boolean; context: string }) => {
      try {
        const config = getConfig();
        const client = new ObsidianClient(config.apiKey, config.apiUrl);
        const json = program.opts().json;

        if (options.dql) {
          const results = await client.searchDQL(query);
          print(results, { json });
        } else {
          const results = await client.search(query, parseInt(options.context));

          if (json) {
            print(results, { json: true });
          } else {
            if (results.length === 0) {
              console.log(c.dim("No results found."));
              return;
            }

            console.log(c.dim(`Found ${results.length} result${results.length === 1 ? "" : "s"}:\n`));

            for (const result of results) {
              console.log(c.cyan(result.filename));
              if (result.matches) {
                for (const match of result.matches) {
                  console.log(`  ${c.dim("...")}${match.context}${c.dim("...")}`);
                }
              }
            }
          }
        }
      } catch (error) {
        exitWithError(error);
      }
    });
}
