# LeRobot 数据集 Mock API 文档

> 覆盖本地两套数据：`black_pen_to_wooden_stand`、`black_mouse_to_wooden_stand`  
> 实现：`src/mocks/lerobotDatasets.ts` + `src/api/client.ts`  
> 类型：`src/types/index.ts`（`LerobotDataset` / `LerobotEpisode` / …）  
> 当前为 **前端内存 Mock**（带 `delay`），路径形如 `/api/v1/lerobot/...` 为约定契约，便于以后换成真实 HTTP。

---

## 1. 数据来源与内容概览

| 数据集名 | Mock ID | 任务 | Episodes | Frames | Videos | FPS | 机器人 | qcStatus |
|----------|---------|------|----------|--------|--------|-----|--------|----------|
| `black_pen_to_wooden_stand` | `ds-pen` | Pick up the black_pen and place it on the wooden_stand. | 20 | 15668 | 60 | 30 | aloha | pending |
| `black_mouse_to_wooden_stand` | `ds-mouse` | Pick up the black mouse and put it on the wooden stand. | 20 | 16423 | 60 | 30 | aloha | passed |

磁盘根目录（相对 `edp-web`）：

| ID | localPath |
|----|-----------|
| `ds-pen` | `public/datasets/ds-pen` |
| `ds-mouse` | `public/datasets/ds-mouse` |

目录结构（两边对称，LeRobot v2.1）：

```text
lerobot_data/
├── meta/
│   ├── info.json            ← 总帧数、fps、feature、路径模板
│   ├── episodes.jsonl       ← 每集 length / task
│   ├── episodes_stats.jsonl
│   └── tasks.jsonl
├── data/chunk-000/
│   └── episode_000000.parquet … episode_000019.parquet
└── videos/chunk-000/
    ├── observation.images.cam_high/episode_*.mp4
    ├── observation.images.cam_left/episode_*.mp4
    └── observation.images.cam_right/episode_*.mp4
```

Mock **已对齐** `info.json` 汇总字段与 `episodes.jsonl` 每集 `length`；**未**解析 parquet 内关节数值，也未提供可播放的 HTTP 视频 URL（路径为相对数据集根的相对路径）。

### 1.1 相机（两套相同）

| key | label | 分辨率 | codec | fps |
|-----|-------|--------|-------|-----|
| `observation.images.cam_high` | 俯视高机位 | 640×480 | av1 | 30 |
| `observation.images.cam_left` | 左腕相机 | 640×480 | av1 | 30 |
| `observation.images.cam_right` | 右腕相机 | 640×480 | av1 | 30 |

### 1.2 Feature 键（`featureKeys`）

```text
observation.state          # float32[14] 双臂关节
action                    # float32[14]
observation.velocity      # float32[14]
observation.effort        # float32[14]
observation.images.cam_high / cam_left / cam_right
timestamp / frame_index / episode_index / index / task_index
```

### 1.3 Episode 帧数一览

**ds-pen（合计 15668）**

| ep | length | durationSec | ep | length | durationSec |
|----|--------|-------------|----|--------|-------------|
| 0 | 504 | 16.8 | 10 | 881 | 29.37 |
| 1 | 754 | 25.13 | 11 | 1005 | 33.5 |
| 2 | 457 | 15.23 | 12 | 943 | 31.43 |
| 3 | 415 | 13.83 | 13 | 886 | 29.53 |
| 4 | 415 | 13.83 | 14 | 1031 | 34.37 |
| 5 | 532 | 17.73 | 15 | 1284 | 42.8 |
| 6 | 483 | 16.1 | 16 | 1092 | 36.4 |
| 7 | 535 | 17.83 | 17 | 1056 | 35.2 |
| 8 | 562 | 18.73 | 18 | 1272 | 42.4 |
| 9 | 517 | 17.23 | 19 | 1044 | 34.8 |

**ds-mouse（合计 16423）**

| ep | length | durationSec | ep | length | durationSec |
|----|--------|-------------|----|--------|-------------|
| 0 | 491 | 16.37 | 10 | 1083 | 36.1 |
| 1 | 460 | 15.33 | 11 | 890 | 29.67 |
| 2 | 790 | 26.33 | 12 | 985 | 32.83 |
| 3 | 423 | 14.1 | 13 | 1035 | 34.5 |
| 4 | 540 | 18 | 14 | 965 | 32.17 |
| 5 | 486 | 16.2 | 15 | 1274 | 42.47 |
| 6 | 539 | 17.97 | 16 | 1128 | 37.6 |
| 7 | 624 | 20.8 | 17 | 1188 | 39.6 |
| 8 | 427 | 14.23 | 18 | 1258 | 41.93 |
| 9 | 591 | 19.7 | 19 | 1246 | 41.53 |

路径示例（episode 0）：

```text
data/chunk-000/episode_000000.parquet
videos/chunk-000/observation.images.cam_high/episode_000000.mp4
videos/chunk-000/observation.images.cam_left/episode_000000.mp4
videos/chunk-000/observation.images.cam_right/episode_000000.mp4
```

---

## 2. 调用方式（Mock）

```ts
import {
  getLerobotDatasets,
  getLerobotDataset,
  getLerobotEpisodes,
  getLerobotEpisode,
} from '@/api/client'

const list = await getLerobotDatasets()
const pen = await getLerobotDataset('ds-pen')
// 也可用数据集名：
const mouse = await getLerobotDataset('black_mouse_to_wooden_stand')
const episodes = await getLerobotEpisodes('ds-mouse')
const ep0 = await getLerobotEpisode('ds-pen', 0)
```

兼容旧接口（摘要字段，无 episodes 明细）：

```ts
import { getDatasets, getDataset } from '@/api/client'
// getDatasets() → DeliveryDataset[]
// getDataset('ds-pen')
```

旧接口数据由完整 Mock **派生**，数字保持一致。

---

## 3. 接口一览

| 方法（约定） | Mock 函数 | 说明 |
|--------------|-----------|------|
| `GET /api/v1/lerobot/datasets` | `getLerobotDatasets()` | 列表摘要（不含 `episodes`） |
| `GET /api/v1/lerobot/datasets/:idOrName` | `getLerobotDataset(idOrName)` | 完整数据集（含全部 episodes） |
| `GET /api/v1/lerobot/datasets/:idOrName/episodes` | `getLerobotEpisodes(idOrName)` | 仅 episode 数组 |
| `GET /api/v1/lerobot/datasets/:idOrName/episodes/:episodeIndex` | `getLerobotEpisode(idOrName, episodeIndex)` | 单集 |

`:idOrName` 接受：

- `ds-pen` / `ds-mouse`
- 或 `black_pen_to_wooden_stand` / `black_mouse_to_wooden_stand`

找不到时 Mock 返回 `null`（以后真 API 建议 `404`）。

---

## 4. 响应结构

### 4.1 列表项 `LerobotDatasetSummary`

与完整对象相同，但**没有** `episodes` 字段。

```json
{
  "id": "ds-pen",
  "name": "black_pen_to_wooden_stand",
  "task": "Pick up the black_pen and place it on the wooden_stand.",
  "version": "v2.1",
  "robotType": "aloha",
  "fps": 30,
  "totalEpisodes": 20,
  "totalFrames": 15668,
  "totalVideos": 60,
  "totalChunks": 1,
  "chunksSize": 1000,
  "splits": { "train": "0:20" },
  "dataPathTemplate": "data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet",
  "videoPathTemplate": "videos/chunk-{episode_chunk:03d}/{video_key}/episode_{episode_index:06d}.mp4",
  "localPath": "public/datasets/ds-pen",
  "cameras": [
    {
      "key": "observation.images.cam_high",
      "label": "俯视高机位",
      "width": 640,
      "height": 480,
      "codec": "av1",
      "fps": 30,
      "channels": 3
    }
  ],
  "featureKeys": [
    "observation.state",
    "action",
    "observation.velocity",
    "observation.effort",
    "observation.images.cam_high",
    "observation.images.cam_left",
    "observation.images.cam_right",
    "timestamp",
    "frame_index",
    "episode_index",
    "index",
    "task_index"
  ],
  "qcStatus": "pending"
}
```

### 4.2 详情 `LerobotDataset`

在 Summary 基础上增加：

```json
{
  "episodes": [
    {
      "episodeIndex": 0,
      "length": 504,
      "durationSec": 16.8,
      "task": "Pick up the black_pen and place it on the wooden_stand.",
      "chunk": 0,
      "dataPath": "data/chunk-000/episode_000000.parquet",
      "videos": {
        "camHigh": "videos/chunk-000/observation.images.cam_high/episode_000000.mp4",
        "camLeft": "videos/chunk-000/observation.images.cam_left/episode_000000.mp4",
        "camRight": "videos/chunk-000/observation.images.cam_right/episode_000000.mp4"
      }
    }
  ]
}
```

### 4.3 单集 `LerobotEpisode`

见上表 `episodes[]` 元素；`durationSec = round(length / fps, 2)`，`fps` 固定 30。

---

## 5. 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 平台内 ID：`ds-pen` / `ds-mouse` |
| `name` | string | 数据集目录名 |
| `task` | string | 来自 `tasks.jsonl` / episode.tasks |
| `version` | string | `info.json.codebase_version` → `v2.1` |
| `robotType` | string | `aloha` |
| `fps` | number | 30 |
| `totalEpisodes` | number | 20 |
| `totalFrames` | number | pen 15668 / mouse 16423 |
| `totalVideos` | number | 60（20×3 相机） |
| `localPath` | string | 相对 `edp-web` 的本地根路径 |
| `cameras` | array | 三路相机元信息 |
| `featureKeys` | string[] | feature 键名 |
| `qcStatus` | enum | 平台侧质检状态（非 LeRobot 原字段） |
| `episodes[].length` | number | 帧数（来自 episodes.jsonl） |
| `episodes[].durationSec` | number | 秒 |
| `episodes[].dataPath` / `videos.*` | string | 相对 `localPath` 的文件路径 |

---

## 6. 源码位置

| 内容 | 路径 |
|------|------|
| Mock 数据 | `src/mocks/lerobotDatasets.ts` |
| API 函数 | `src/api/client.ts`（`getLerobot*`） |
| 类型 | `src/types/index.ts` |
| 旧交付摘要 | `getDatasets` / `getDataset`（由完整 Mock 派生） |

---

## 7. 以后接真实后端

把 `getLerobot*` 内的 mock 查找换成例如：

```ts
export async function getLerobotDataset(idOrName: string) {
  const res = await fetch(`/api/v1/lerobot/datasets/${encodeURIComponent(idOrName)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

页面只需继续调同名函数，无需改调用方（本阶段页面接入细节不做）。
