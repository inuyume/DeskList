import { describe, expect, it } from "vitest";
import { createDefaultData, normalizeAppData } from "./validation";

describe("data validation", () => {
  it("creates a valid default Today list", () => {
    const data = createDefaultData();
    expect(data.lists).toHaveLength(1);
    expect(data.lists[0].name).toBe("今天");
    expect(data.settings.floatingWindowEnabled).toBe(false);
    expect(normalizeAppData(data)).not.toBeNull();
  });

  it("preserves the floating window preference during normalization", () => {
    const data = createDefaultData();
    data.settings.floatingWindowEnabled = true;
    expect(normalizeAppData(data)?.settings.floatingWindowEnabled).toBe(true);
  });

  it("rejects unusable roots and unknown future versions", () => {
    expect(normalizeAppData({ lists: [] })).toBeNull();
    expect(normalizeAppData({ version: 99, lists: [createDefaultData().lists[0]] })).toBeNull();
  });

  it("normalizes duplicate ids, invalid settings and task fields", () => {
    const data = createDefaultData();
    const list = data.lists[0];
    data.lists.push({ ...structuredClone(list), name: "另一个", sortOrder: Number.NaN });
    data.activeListId = "missing";
    Object.assign(data.settings, { showCompleted: "yes" });
    list.tasks.push({ id: "task", title: " 合法任务 ", completed: true, sortOrder: -4, createdAt: "bad", updatedAt: "bad", completedAt: null });
    const result = normalizeAppData(data);
    expect(result).not.toBeNull();
    expect(new Set(result!.lists.map((item) => item.id)).size).toBe(2);
    expect(result!.activeListId).toBe(result!.lists[0].id);
    expect(result!.settings.showCompleted).toBe(true);
    expect(result!.lists[0].tasks[0]).toMatchObject({ title: "合法任务", completed: true, sortOrder: 0 });
  });
});
