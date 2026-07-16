export interface AppData {
  version: number;
  activeListId: string;
  lists: TodoList[];
  settings: AppSettings;
}

export interface TodoList {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  tasks: TodoTask[];
}

export interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AppSettings {
  alwaysOnTop: boolean;
  launchAtStartup: boolean;
  startHidden: boolean;
  showCompleted: boolean;
  moveCompletedToBottom: boolean;
  closeToTrayHintShown: boolean;
}

export type SaveMode = "immediate" | "debounced";
