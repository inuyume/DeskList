import type { AppData, AppSettings, TodoList, TodoTask } from "../types/todo";

export const DATA_VERSION = 1;

const defaultSettings = (): AppSettings => ({
  alwaysOnTop: false,
  floatingWindowEnabled: false,
  launchAtStartup: false,
  startHidden: false,
  showCompleted: true,
  moveCompletedToBottom: true,
  closeToTrayHintShown: false,
});

const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function createDefaultData(): AppData {
  const timestamp = now();
  const listId = newId();
  return {
    version: DATA_VERSION,
    activeListId: listId,
    lists: [{ id: listId, name: "今天", sortOrder: 0, createdAt: timestamp, updatedAt: timestamp, tasks: [] }],
    settings: defaultSettings(),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));
const cleanOrder = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;

function normalizeTask(value: unknown, index: number, ids: Set<string>): TodoTask | null {
  if (!isRecord(value) || typeof value.title !== "string") return null;
  const title = value.title.trim().slice(0, 300);
  if (!title) return null;
  let id = typeof value.id === "string" && value.id ? value.id : newId();
  if (ids.has(id)) id = newId();
  ids.add(id);
  const completed = value.completed === true;
  const createdAt = isIsoDate(value.createdAt) ? value.createdAt : now();
  const updatedAt = isIsoDate(value.updatedAt) ? value.updatedAt : createdAt;
  return {
    id,
    title,
    completed,
    sortOrder: cleanOrder(value.sortOrder, index),
    createdAt,
    updatedAt,
    completedAt: completed && isIsoDate(value.completedAt) ? value.completedAt : completed ? updatedAt : null,
  };
}

function normalizeList(value: unknown, index: number, ids: Set<string>): TodoList | null {
  if (!isRecord(value) || typeof value.name !== "string" || !Array.isArray(value.tasks)) return null;
  const name = value.name.trim().slice(0, 40);
  if (!name) return null;
  let id = typeof value.id === "string" && value.id ? value.id : newId();
  if (ids.has(id)) id = newId();
  ids.add(id);
  const taskIds = new Set<string>();
  const tasks = value.tasks
    .map((task, taskIndex) => normalizeTask(task, taskIndex, taskIds))
    .filter((task): task is TodoTask => task !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((task, taskIndex) => ({ ...task, sortOrder: taskIndex }));
  const createdAt = isIsoDate(value.createdAt) ? value.createdAt : now();
  return {
    id,
    name,
    sortOrder: cleanOrder(value.sortOrder, index),
    createdAt,
    updatedAt: isIsoDate(value.updatedAt) ? value.updatedAt : createdAt,
    tasks,
  };
}

function normalizeSettings(value: unknown): AppSettings {
  const defaults = defaultSettings();
  if (!isRecord(value)) return defaults;
  for (const key of Object.keys(defaults) as (keyof AppSettings)[]) {
    if (typeof value[key] === "boolean") defaults[key] = value[key];
  }
  return defaults;
}

export function normalizeAppData(value: unknown): AppData | null {
  if (!isRecord(value) || !Array.isArray(value.lists)) return null;
  if (typeof value.version === "number" && value.version > DATA_VERSION) return null;
  const ids = new Set<string>();
  const lists = value.lists
    .map((list, index) => normalizeList(list, index, ids))
    .filter((list): list is TodoList => list !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((list, index) => ({ ...list, sortOrder: index }));
  if (!lists.length) return null;
  const activeListId = typeof value.activeListId === "string" && ids.has(value.activeListId)
    ? value.activeListId
    : lists[0].id;
  return { version: DATA_VERSION, activeListId, lists, settings: normalizeSettings(value.settings) };
}
