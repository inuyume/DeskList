import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultData } from "../utils/validation";

const files = new Map<string, Map<string, unknown>>();
const corruptPaths = new Set<string>();
vi.mock("@tauri-apps/plugin-store", () => ({
  load: vi.fn(async (path: string, options?: { createNew?: boolean }) => {
    if (corruptPaths.has(path) && !options?.createNew) throw new Error("invalid JSON");
    if (options?.createNew) corruptPaths.delete(path);
    const values = files.get(path) ?? new Map<string, unknown>();
    files.set(path, values);
    return {
      get: async (key: string) => values.get(key),
      set: async (key: string, value: unknown) => { values.set(key, value); },
      save: async () => undefined,
    };
  }),
}));

describe("storage recovery", () => {
  beforeEach(() => { files.clear(); corruptPaths.clear(); });

  it("recovers invalid primary data from the latest valid backup", async () => {
    const backup = createDefaultData();
    backup.lists[0].name = "已恢复";
    files.set("desklist.json", new Map([["appData", { broken: true }]]));
    files.set("desklist.backup.json", new Map([["appData", backup]]));
    vi.resetModules();
    const { loadData } = await import("./storageService");
    const result = await loadData();
    expect(result.recovered).toBe(true);
    expect(result.data.lists[0].name).toBe("已恢复");
    expect(files.get("desklist.json")?.get("appData")).toMatchObject({ activeListId: backup.activeListId });
  });

  it("recreates a physically corrupt primary store after reading the backup", async () => {
    const backup = createDefaultData();
    corruptPaths.add("desklist.json");
    files.set("desklist.backup.json", new Map([["appData", backup]]));
    vi.resetModules();
    const { loadData } = await import("./storageService");
    const result = await loadData();
    expect(result.recovered).toBe(true);
    expect(corruptPaths.has("desklist.json")).toBe(false);
    expect(files.get("desklist.json")?.get("appData")).toMatchObject({ activeListId: backup.activeListId });
  });

  it("recreates corrupt stores when saving", async () => {
    corruptPaths.add("desklist.json");
    corruptPaths.add("desklist.backup.json");
    vi.resetModules();
    const { saveData } = await import("./storageService");
    const data = createDefaultData();

    await expect(saveData(data)).resolves.toBeUndefined();

    expect(corruptPaths.size).toBe(0);
    expect(files.get("desklist.json")?.get("appData")).toMatchObject({ activeListId: data.activeListId });
  });
});
