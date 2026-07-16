import type { TodoTask } from "../types/todo";

export function sortTasks(tasks: TodoTask[], moveCompletedToBottom: boolean): TodoTask[] {
  return [...tasks].sort((a, b) => {
    if (moveCompletedToBottom && a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
}
