# DeskList Codex 开发提示词

> 提示词版本：1.1  
> 最近维护：2026-07-16  
> 维护方式：需求发生变化时直接更新对应章节，并同步更新本文末尾的维护记录和 `DEVELOPMENT.md` 实施状态。

## 提示词维护约定

- 本文是产品和工程实现的唯一需求基线，README 只描述已经实现并验证的能力。
- 新需求必须写明功能规则、异常行为、验收方式以及是否影响数据模型。
- 修改数据模型时必须同步调整数据版本、规范化逻辑、导入校验和自动化测试。
- 修改 Tauri 能力时必须同步调整 Rust 插件、前端依赖和 capability 最小权限。
- 项目使用 Bun；文中的 npm 示例命令在本仓库中分别对应 `bun install`、`bun run type-check`、`bun run test`、`bun run build` 和 `bun run tauri build`。
- 不把临时调试方案、未经验证的功能或未来设想写成已完成要求。

你是一名资深 Tauri、Rust、Vue 3 和 TypeScript 桌面应用工程师。请在当前工作目录中从零开发一个可运行、可构建、适用于 Windows 10/11 的轻量桌面待办应用。

项目名称暂定为：**DeskList**

请不要只提供示例代码、伪代码、架构建议或代码片段。你需要直接创建并修改项目文件，安装依赖，完成实现，运行类型检查和构建，并修复发现的问题。

---

## 一、项目目标

DeskList 是一个轻量化、离线运行、常驻 Windows 桌面的 To-do List。

用户需要能够：

1. 创建多个 List。
2. 在不同 List 之间切换。
3. 随时添加任务。
4. 勾选已经完成的任务。
5. 编辑和删除任务。
6. 将窗口设置为始终置顶。
7. 关闭窗口后隐藏到系统托盘。
8. 使用全局快捷键显示或隐藏窗口。
9. 选择是否开机启动。
10. 重启应用后保留数据。
11. 导入或导出本地 JSON 数据。

应用不得依赖服务器和互联网。

---

## 二、固定技术栈

必须使用：

- Tauri 2
- Vue 3
- TypeScript
- Vite
- Vue Composition API
- 原生 CSS
- Tauri Store 官方插件
- Tauri Global Shortcut 官方插件
- Tauri Autostart 官方插件
- Tauri Window State 官方插件
- Tauri Dialog 官方插件
- 必要时使用 Tauri File System 官方插件

不要使用：

- Electron
- React
- Pinia
- Vuex
- Element Plus
- Ant Design Vue
- Vuetify
- Tailwind CSS
- Axios
- Lodash
- Moment.js
- Day.js
- 动画库
- Node.js 后端
- 本地 HTTP 服务
- SQLite
- 远程数据库
- Docker
- 云端 API
- 登录注册
- 网络请求

如果当前目录已经有项目，请先检查现有结构并在兼容现有代码的前提下实现；不要无理由删除用户已有内容。

---

## 三、开发前检查

开始编码前请检查：

- Node.js
- npm 或 pnpm
- Rust
- Cargo
- Tauri CLI
- Windows WebView2
- Visual Studio C++ Build Tools

如果某个本地环境依赖缺失：

1. 明确指出缺失项。
2. 仍然完成所有能够完成的源代码。
3. 不要因为缺少构建环境而停止编码。
4. 不要伪造构建成功结果。

优先使用项目当前使用的包管理器；如果没有，使用 npm。

---

## 四、项目架构

建议项目结构如下，可根据 Tauri 官方初始化结果做合理调整：

```text
desklist/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ AppHeader.vue
│  │  ├─ ListSidebar.vue
│  │  ├─ ListItem.vue
│  │  ├─ TaskList.vue
│  │  ├─ TaskItem.vue
│  │  ├─ QuickAdd.vue
│  │  ├─ ConfirmDialog.vue
│  │  ├─ ToastContainer.vue
│  │  └─ SettingsView.vue
│  ├─ composables/
│  │  ├─ useTodoStore.ts
│  │  ├─ useToast.ts
│  │  └─ useWindowControls.ts
│  ├─ services/
│  │  ├─ storageService.ts
│  │  ├─ importExportService.ts
│  │  ├─ shortcutService.ts
│  │  └─ autostartService.ts
│  ├─ types/
│  │  └─ todo.ts
│  ├─ utils/
│  │  ├─ validation.ts
│  │  ├─ sorting.ts
│  │  └─ debounce.ts
│  ├─ styles/
│  │  ├─ variables.css
│  │  ├─ reset.css
│  │  └─ global.css
│  ├─ App.vue
│  └─ main.ts
├─ src-tauri/
│  ├─ capabilities/
│  ├─ icons/
│  ├─ src/
│  │  ├─ lib.rs
│  │  └─ main.rs
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ tests/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

保持结构清晰，但不要为了架构而过度抽象。

---

## 五、数据模型

请实现以下 TypeScript 数据结构：

```ts
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
```

ID 使用：

```ts
crypto.randomUUID()
```

时间统一保存为 ISO 8601 UTC 字符串。

默认数据至少包含一个名为“今天”的 List。

---

## 六、功能要求

### 6.1 List

实现：

- 新建 List
- 切换 List
- 重命名 List
- 删除 List
- 显示未完成任务数
- 保存最后打开的 List
- 支持 List 排序

规则：

- List 名称去除首尾空格。
- 不允许空名称。
- 最大 40 个字符。
- 仅剩一个 List 时不允许删除。
- 删除 List 前必须确认。
- 删除当前 List 后切换到相邻 List。

### 6.2 Task

实现：

- 添加任务
- 编辑任务
- 删除任务
- 勾选完成
- 取消完成
- 调整任务排序
- 显示或隐藏已完成任务
- 清除当前 List 的已完成任务
- 已完成任务移动到底部

规则：

- 输入框始终可见。
- Enter 添加任务。
- 空字符串不添加。
- 自动去除首尾空格。
- 最大 300 个字符。
- 添加后清空输入框并继续聚焦。
- 双击任务标题编辑。
- Enter 保存编辑。
- Escape 取消编辑。
- 删除单条任务无需确认。
- `completedAt` 在完成时写入，取消完成时清空。

### 6.3 窗口

实现：

- 始终置顶开关
- 记住窗口位置和大小
- 关闭按钮隐藏到系统托盘
- 托盘菜单真正退出
- 单击或双击托盘图标显示主窗口
- 全局快捷键显示或隐藏主窗口
- 主窗口显示后聚焦任务输入框
- 尽可能实现单实例运行

窗口建议：

```text
默认宽度：440
默认高度：560
最小宽度：340
最小高度：400
默认始终置顶：关闭
允许调整大小：开启
允许最大化：关闭
```

第一版使用系统原生标题栏，不要做无边框、透明或毛玻璃窗口。

### 6.4 系统托盘

菜单包含：

```text
显示 DeskList
快速添加
始终置顶
开机启动
退出
```

需要正确区分：

- 隐藏窗口
- 退出应用

点击“退出”后必须真正结束程序，而不是再次触发隐藏逻辑。

### 6.5 全局快捷键

默认使用：

```text
Ctrl + Alt + Space
```

快捷键行为：

- 隐藏时显示窗口。
- 显示时隐藏窗口。
- 显示后将窗口带到前台。
- 聚焦快速添加输入框。

快捷键注册失败时：

- 应用不得崩溃。
- 显示用户可理解的提示。
- 将技术错误写入日志。

### 6.6 开机启动

设置页提供开关。

默认关闭。

开启后：

- 用户登录 Windows 时启动。
- 如果 `startHidden` 为 `true`，则启动后隐藏到托盘。
- 不要主动抢占用户当前焦点。

### 6.7 设置页面

实现：

- 始终置顶
- 开机启动
- 启动后隐藏
- 显示已完成任务
- 完成任务移动到底部
- 查看全局快捷键状态
- 导出数据
- 导入数据
- 重置应用数据
- 应用版本信息

设置页面放在主窗口内部，不创建第二个 WebView 窗口。

---

## 七、数据持久化

使用 Tauri Store 官方插件。

逻辑文件名：

```text
desklist.json
```

要求：

- 应用启动时加载数据。
- 文件不存在时创建默认数据。
- 增删改后自动保存。
- 编辑文字和排序操作使用约 300ms 防抖。
- 添加、删除、完成、创建 List、删除 List 等操作立即保存。
- 保存失败时显示 Toast。
- 不允许保存失败导致应用崩溃。

实现一个最近备份：

```text
desklist.backup.json
```

写入主要数据前，将最近一次有效数据保存为备份。

启动恢复流程：

1. 加载主要数据。
2. 校验数据。
3. 主要数据损坏时加载备份。
4. 备份有效时恢复并提示用户。
5. 两者都无效时加载默认数据。
6. 任何情况下都不能白屏。

请实现健壮的数据校验和规范化函数，至少处理：

- `version` 缺失
- `lists` 不是数组
- `lists` 为空
- `activeListId` 无效
- List 字段缺失
- Task 字段缺失
- 重复 ID
- 非法 `completed` 值
- 非法 `sortOrder`
- 非法 `settings`

不要简单地对外部 JSON 使用类型断言后直接信任。

---

## 八、导入导出

导出：

- 导出完整 `AppData`。
- 输出格式为 JSON。
- 格式化缩进为 2 个空格。
- 文件名示例：

```text
desklist-backup-2026-07-15.json
```

导入：

1. 打开文件选择对话框。
2. 读取 JSON。
3. 严格解析并校验。
4. 显示确认对话框。
5. 导入前备份现有数据。
6. 导入成功后刷新状态。
7. 导入失败不得影响当前数据。

重置数据：

- 必须二次确认。
- 重置前自动备份。
- 重置后恢复默认“今天”List。

---

## 九、UI 设计

制作一个紧凑、清晰的浅色桌面 UI。

双栏布局：

- 左侧：List
- 右侧：当前 List 的任务
- 底部：快速添加输入框
- 顶部：当前 List 名称、设置入口、始终置顶状态

视觉要求：

- 使用原生 CSS。
- 不使用 UI 框架。
- 不使用复杂渐变。
- 不使用玻璃拟态。
- 不使用大型阴影。
- 不使用持续动画。
- 不使用动画库。
- 可以使用少量不超过 150ms 的 CSS transition。
- 使用少量内联 SVG 图标，或者按需引入轻量图标。
- 确保 125% 和 150% Windows 缩放下可用。
- 不出现横向滚动条。
- 提供键盘可访问性。
- 按钮必须有 `title` 或 `aria-label`。
- 键盘焦点状态必须清晰可见。

建议 CSS 变量：

```css
:root {
  --background: #f7f7f8;
  --surface: #ffffff;
  --surface-hover: #f1f1f2;
  --text-primary: #1f2328;
  --text-secondary: #6e7781;
  --border: #d8dee4;
  --accent: #2563eb;
  --danger: #dc2626;
  --radius-small: 6px;
  --radius-medium: 10px;
}
```

任务完成后：

- 标题弱化。
- 使用删除线。
- 移动到底部。
- 不要播放复杂动画。

空列表时显示友好空状态。

---

## 十、轻量化约束

必须遵守：

1. 只使用一个主窗口。
2. 不创建后台 HTTP 服务。
3. 不进行任何网络请求。
4. 不使用轮询。
5. 不使用持续定时器。
6. 不使用动画库。
7. 不使用大型 UI 组件库。
8. 不引入与需求无关的依赖。
9. 不使用 `any` 逃避 TypeScript 类型。
10. 不在生产环境启用开发工具。
11. 窗口隐藏时不运行无意义动画。
12. 空闲状态不持续触发响应式更新。
13. 不使用透明窗口和实时模糊。
14. 依赖必须按需引入。
15. 每个新增依赖都要在 README 中说明用途。

不要为了追求所谓“企业级架构”添加 Repository、DTO、依赖注入容器或复杂领域层。项目需要可靠，但保持简单。

---

## 十一、Tauri 安全要求

使用 Tauri 2 capability 权限机制并遵循最小权限原则。

只允许本应用所需的：

- Store
- Dialog
- 文件导入导出
- Global Shortcut
- Autostart
- 窗口控制
- Window State

禁止：

- 无限制 Shell 执行
- 任意外部命令
- 不必要的网络权限
- 不受限制的文件系统访问
- 不必要的剪贴板权限

请检查 capability 配置是否与实际调用匹配。

---

## 十二、异常处理

请正确处理：

- 存储文件不存在
- 存储文件为空
- JSON 格式错误
- 数据结构不完整
- 数据版本未知
- 主数据损坏
- 备份损坏
- 保存失败
- 导入失败
- 用户取消导入或导出
- 全局快捷键被占用
- 开机启动设置失败
- 窗口位置位于已断开的显示器之外
- 托盘图标初始化失败

用户错误提示应简洁易懂，技术细节写入控制台或日志。

不要空 `catch`。

---

## 十三、测试

请添加合理的自动化测试，至少覆盖：

- 创建 List
- 删除 List
- 最后一个 List 不可删除
- 添加任务
- 空任务不可添加
- 完成和取消完成
- 删除任务
- 已完成任务排序
- 数据规范化
- 损坏数据恢复
- 导入数据校验

优先测试纯 TypeScript 业务逻辑。

如果 Tauri 系统能力不容易自动测试，请在 README 中写出手工测试步骤。

---

## 十四、README

README 必须包含：

- 项目简介
- 截图占位说明
- 功能列表
- 技术栈
- Windows 开发依赖
- 安装步骤
- 开发运行命令
- 类型检查命令
- 测试命令
- Release 构建命令
- 数据保存说明
- 导入导出说明
- 全局快捷键
- 项目结构
- 使用的依赖及用途
- 已知限制
- 手工测试清单

命令必须与实际 `package.json` 一致。

---

## 十五、实现顺序

按以下顺序执行：

1. 检查当前目录和环境。
2. 初始化或修复 Tauri 2 + Vue 3 + TypeScript 项目。
3. 定义类型和默认数据。
4. 实现纯前端 List 和 Task 业务逻辑。
5. 实现本地持久化。
6. 实现数据校验与备份恢复。
7. 实现主界面和设置页面。
8. 实现窗口置顶和窗口状态恢复。
9. 实现系统托盘和关闭到托盘。
10. 实现全局快捷键。
11. 实现开机启动。
12. 实现导入导出。
13. 添加测试。
14. 编写 README。
15. 执行格式化、类型检查、测试和构建。
16. 修复所有能够复现的问题。

---

## 十六、完成标准

至少执行：

```powershell
npm install
npm run type-check
npm run test
npm run build
npm run tauri build
```

我的包管理器使用的是bun请你自适应上面的npm命令

如果项目使用不同的脚本名，应使用实际脚本。

完成后给出：

1. 已实现功能清单。
2. 项目主要文件说明。
3. 安装的依赖及用途。
4. 执行过的命令。
5. 类型检查结果。
6. 测试结果。
7. 前端构建结果。
8. Tauri 构建结果。
9. 安装包或可执行文件的位置。
10. 尚未完成或无法验证的内容。
11. 下一步建议。

不得声称未实际执行的命令已经成功。

### 提示词维护记录

- 2026-07-16 / v1.1：补充提示词版本、维护约定和 Bun 命令映射；不改变 MVP 功能范围。

---

## 十七、工作方式

请直接开始操作，不要先反复向我提问。

遇到不影响核心实现的小歧义时，自行采用简单、可靠、轻量的方案。

只有在可能覆盖现有重要文件、删除用户数据或需要外部机密信息时才停止并询问。

每完成一个重要阶段，可以简短汇报当前结果，但不要只汇报计划而不编码。

最终交付必须是一个实际可运行的项目，而不是教程。
