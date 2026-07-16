import { describe, expect, it, vi } from "vitest";
import { createDefaultData } from "../utils/validation";
import { createTodoStore } from "./useTodoStore";

describe("todo store", () => {
  it("creates and deletes lists but protects the final list", () => {
    const save = vi.fn();
    const store = createTodoStore(createDefaultData(), save);
    const firstId = store.state.lists[0].id;
    expect(store.deleteList(firstId)).toBe(false);
    expect(store.addList(" 工作 ")).toBe(true);
    expect(store.activeList.value.name).toBe("工作");
    expect(store.deleteList(store.state.activeListId)).toBe(true);
    expect(store.state.activeListId).toBe(firstId);
    expect(save).toHaveBeenCalled();
  });

  it("adds, edits, completes, restores and deletes tasks", () => {
    const store = createTodoStore(createDefaultData());
    expect(store.addTask("   ")).toBe(false);
    expect(store.addTask("  写周报  ")).toBe(true);
    const id = store.activeList.value.tasks[0].id;
    expect(store.editTask(id, "整理周报")).toBe(true);
    store.toggleTask(id);
    expect(store.activeList.value.tasks[0]).toMatchObject({ title: "整理周报", completed: true });
    expect(store.activeList.value.tasks[0].completedAt).not.toBeNull();
    store.toggleTask(id);
    expect(store.activeList.value.tasks[0].completedAt).toBeNull();
    store.deleteTask(id);
    expect(store.activeList.value.tasks).toHaveLength(0);
  });

  it("moves completed tasks to the bottom without destroying manual order", () => {
    const store = createTodoStore(createDefaultData());
    store.addTask("第一项"); store.addTask("第二项"); store.addTask("第三项");
    store.toggleTask(store.activeList.value.tasks[0].id);
    expect(store.visibleTasks.value.map((task) => task.title)).toEqual(["第二项", "第三项", "第一项"]);
  });
});
