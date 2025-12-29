#!/usr/bin/env bun

import { Command } from "commander";
import { registerStatusCommand } from "./commands/status";
import { registerNoteCommand } from "./commands/note";
import { registerActiveCommand } from "./commands/active";
import { registerDailyCommand } from "./commands/daily";
import { registerPeriodicCommand } from "./commands/periodic";
import { registerSearchCommand } from "./commands/search";
import { registerCommandsCommand } from "./commands/commands";
import { registerOpenCommand } from "./commands/open";
import { registerVaultCommand } from "./commands/vault";
import { registerUpdateCommand } from "./commands/update";

const program = new Command();

program
  .name("obsidian")
  .description("CLI for Obsidian using Local REST API")
  .version("0.1.2")
  .option("--json", "Output as JSON");

registerStatusCommand(program);
registerNoteCommand(program);
registerActiveCommand(program);
registerDailyCommand(program);
registerPeriodicCommand(program);
registerSearchCommand(program);
registerCommandsCommand(program);
registerOpenCommand(program);
registerVaultCommand(program);
registerUpdateCommand(program);

program.parse();
