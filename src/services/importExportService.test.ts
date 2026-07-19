import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(async () => "invalid.json"),
  save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(async () => "not valid json"),
  writeTextFile: vi.fn(),
}));

import { pickImportData } from "./importExportService";

describe("import service", () => {
  it("returns a friendly error for malformed JSON", async () => {
    await expect(pickImportData()).rejects.toThrow("文件格式错误，无法解析 JSON 内容");
  });
});
