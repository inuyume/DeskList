# DeskList

DeskList 是一个面向 Windows 10/11 的轻量离线待办应用。它提供完整主窗口和透明桌面悬浮窗，支持多清单、快速任务录入、本地持久化、系统托盘、全局快捷键、开机启动和 JSON 备份，不需要账户、服务器或网络请求。

> 截图：项目完成 Windows 手工验收后，将主界面截图放到 `docs/screenshots/main.png` 并在此处引用。

## 功能

- 创建、切换、重命名、删除和排序清单，显示每个清单的未完成数量。
- 添加、编辑、删除、完成、取消完成和排序任务。
- 显示/隐藏已完成任务，自动将已完成任务移到底部，批量清除已完成任务。
- 使用 Tauri Store 自动保存，并在写入前保留最近有效备份。
- 主数据损坏时尝试从备份恢复；两份数据均无效时安全回到默认“今天”清单。
- 始终置顶、窗口位置与大小恢复、关闭到托盘、托盘真正退出。
- `Ctrl + Alt + Space` 全局显示/隐藏窗口，显示后聚焦快速添加输入框。
- 透明、无边框、始终置顶的桌面悬浮窗，不占任务栏，可拖动和调整大小。
- 悬浮窗支持切换清单以及任务添加、编辑、完成、取消完成和删除。
- 主窗口与悬浮窗通过 Tauri 事件实时同步同一份本地数据。
- 可选开机启动和启动后隐藏。
- 严格校验后导入或导出完整 JSON 数据，导入/重置前自动备份。
- 单实例运行、键盘焦点样式、按钮可访问名称以及 340px 最小宽度布局。

## 技术栈

- Tauri 2 / Rust：桌面外壳、托盘、窗口生命周期和单实例。
- Vue 3 Composition API / TypeScript：界面与业务状态。
- Vite：开发和生产前端构建。
- 原生 CSS：无 UI 框架、Tailwind 或动画库。
- Vitest：纯 TypeScript 业务逻辑与恢复流程测试。

## Windows 开发依赖

- Windows 10 或 11
- Bun
- Rust stable（Rust 1.77.2 或更高版本）与 Cargo
- Microsoft Visual Studio C++ Build Tools（Desktop development with C++）
- Microsoft Edge WebView2 Runtime

## 安装与运行

本项目当前开发环境为 Conda 的 `minidev` 环境：

```powershell
conda activate minidev
bun install
bun run tauri dev
```

如果普通 PowerShell 尚未初始化 Conda，可使用：

```powershell
C:\ProgramData\miniforge3\Scripts\conda.exe run -n minidev bun run tauri dev
```

质量检查和构建：

```powershell
bun run type-check
bun run test
bun run build
bun run tauri build
```

`bun run build` 会先执行 Vue/TypeScript 类型检查，再生成 `dist/`。项目默认构建已验证的 NSIS 安装包；可执行文件位于 `src-tauri/target/release/desklist.exe`，安装包位于 `src-tauri/target/release/bundle/nsis/`。

## 数据与备份

主数据由 Tauri Store 保存为应用数据目录中的 `desklist.json`，最近有效备份保存为 `desklist.backup.json`。添加、删除、完成等离散操作立即保存；文本编辑与排序约 300ms 防抖保存。保存失败只显示错误提示，不会让界面崩溃。

设置页可导出缩进为两个空格的完整 `AppData` JSON。导入时先解析并规范化所有字段，再要求确认；用户取消或校验失败不会修改当前数据。重置需要确认，并会先备份当前数据。

## 主要目录

```text
src/
  components/       Vue 界面组件
  composables/      业务状态、Toast 和窗口控制
  services/         持久化、导入导出、快捷键和开机启动
  styles/           全局原生 CSS
  types/            AppData 数据模型
  utils/            校验、排序和防抖工具
src-tauri/
  capabilities/     主窗口与悬浮窗分离的 Tauri 最小权限
  src/lib.rs         托盘、窗口关闭行为和单实例
CODEX_PROMPT.md      产品与工程需求基线
DEVELOPMENT.md       设计与实施记录
```

## 依赖用途

- `vue`：响应式界面。
- `@tauri-apps/api`：窗口、事件和应用版本 API。
- `@tauri-apps/plugin-store`：结构化本地数据持久化。
- `@tauri-apps/plugin-dialog`、`plugin-fs`：用户选择后的 JSON 导入导出。
- `@tauri-apps/plugin-global-shortcut`：全局显示/隐藏快捷键。
- `@tauri-apps/plugin-autostart`：Windows 登录启动设置。
- `@tauri-apps/plugin-window-state`：窗口位置与大小恢复。
- Rust `tauri-plugin-single-instance`：阻止重复实例并激活已有窗口。
- `vite`、`typescript`、`vue-tsc`、`@vitejs/plugin-vue`：开发、类型检查和构建。
- `vitest`：自动化测试。

## 已知限制

- 当前只面向 Windows 10/11；其他平台不是 MVP 验收范围。
- 全局快捷键可能被其他程序占用，设置页会显示注册失败状态，应用仍可正常使用。
- 透明度由 Windows WebView2 与桌面合成器渲染；远程桌面、节能模式或旧显卡驱动可能降低透明效果。
- MVP 不包含拖拽排序；使用每项旁边的上移/下移按钮完成键盘可访问的排序。
- `startHidden` 当前适用于每次启动，不区分手工启动和系统自启动。

## 手工测试清单

1. 创建两个清单，重命名、调整顺序并删除其中一个；确认最后一个清单无法删除。
2. 添加三项任务，双击或点击标题编辑；用 Enter 保存、Escape 取消。
3. 完成、取消完成、上下移动、删除任务，并测试显示已完成与清除已完成。
4. 关闭窗口，确认进程仍在托盘；从托盘显示，再从托盘“退出”确认进程结束。
5. 单击/双击托盘图标，确认主窗口显示并获得焦点。
6. 按 `Ctrl + Alt + Space` 反复显示/隐藏，确认显示后输入框获得焦点。
7. 切换始终置顶、开机启动和启动后隐藏，重启应用确认状态。
8. 移动和缩放窗口后退出再打开，确认窗口状态恢复且不会落在已断开的屏幕外。
9. 导出 JSON，添加任务后重新导入，确认预览确认、替换和取消路径都正确。
10. 重置数据，确认恢复“今天”清单；模拟损坏主数据后确认从备份恢复。
11. 在 Windows 125% 与 150% 缩放、340px 最小宽度下检查无横向滚动且焦点可见。
12. 尝试启动第二个实例，确认只激活已有窗口。
13. 从主窗口顶部、设置页和托盘分别显示/隐藏悬浮窗。
14. 拖动和缩放悬浮窗，确认背景透明、窗口始终置顶且任务栏没有第二个图标。
15. 在主窗口和悬浮窗之间交替添加、编辑、完成和删除任务，确认状态实时同步且重启后不丢失。
