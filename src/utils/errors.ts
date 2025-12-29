export class CLIError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.name = "CLIError";
    this.exitCode = exitCode;
  }
}

export interface ErrorResult {
  message: string;
  exitCode: number;
}

export function handleError(error: unknown): ErrorResult {
  if (error instanceof CLIError) {
    return {
      message: error.message,
      exitCode: error.exitCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      exitCode: 1,
    };
  }

  return {
    message: "An unexpected error occurred",
    exitCode: 1,
  };
}

export function exitWithError(error: unknown): never {
  const { message, exitCode } = handleError(error);
  console.error(`\x1b[31m✖\x1b[0m ${message}`);
  process.exit(exitCode);
}
