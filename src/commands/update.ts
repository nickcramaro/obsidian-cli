import { Command } from "commander";
import { spawn } from "child_process";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update obsidian-cli to the latest version")
    .action(async () => {
      console.log("Updating obsidian-cli...\n");

      const installScript =
        "curl -fsSL https://raw.githubusercontent.com/nickcramaro/obsidian-cli/main/install.sh | bash";

      const child = spawn("bash", ["-c", installScript], {
        stdio: "inherit",
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("\nUpdate complete!");
        } else {
          console.error(`\nUpdate failed with code ${code}`);
          process.exit(1);
        }
      });

      child.on("error", (err) => {
        console.error("Failed to run update:", err.message);
        process.exit(1);
      });
    });
}
