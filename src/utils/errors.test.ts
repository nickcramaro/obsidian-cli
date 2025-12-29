import { describe, it, expect } from "bun:test";
import { CLIError, handleError } from "./errors";

describe("CLIError", () => {
  it("creates error with message and exit code", () => {
    const error = new CLIError("File not found", 1);
    expect(error.message).toBe("File not found");
    expect(error.exitCode).toBe(1);
  });

  it("defaults to exit code 1", () => {
    const error = new CLIError("Something went wrong");
    expect(error.exitCode).toBe(1);
  });
});

describe("handleError", () => {
  it("extracts message from CLIError", () => {
    const error = new CLIError("Custom error");
    const result = handleError(error);
    expect(result.message).toBe("Custom error");
    expect(result.exitCode).toBe(1);
  });

  it("extracts message from standard Error", () => {
    const error = new Error("Standard error");
    const result = handleError(error);
    expect(result.message).toBe("Standard error");
    expect(result.exitCode).toBe(1);
  });

  it("handles unknown error types", () => {
    const result = handleError("string error");
    expect(result.message).toBe("An unexpected error occurred");
    expect(result.exitCode).toBe(1);
  });
});
