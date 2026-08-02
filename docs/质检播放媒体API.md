# 质检播放媒体 API（视频 + 手轨迹）

> 面向详情页三路画面与「3D Hand Overlay」  
> 与 [质检详情API.md](./质检详情API.md) 的 4 个业务接口互补；与 [LeRobot数据集API.md](./LeRobot数据集API.md) 在路径上对齐  
> 实现：`src/mocks/qcPlayback.ts` + `src/api/client.ts`  
> 类型：`QcPlaybackManifest` / `HandTrajectoryResponse` 等（`src/types/index.ts`）

---

## 0. 数据现实（先读）

| 来源 | 有什么 | 没有什么 |
|------|--------|----------|
| `black_pen` / `black_mouse` LeRobot 包 | 三路 `mp4`（cam_high / left / right）、`observation.state` 14 维**手臂**关节 | **没有** HaMeR 手部 21 点轨迹文件 |
| 质检详情 UI | 左目 / 右目 / 手部叠加 三个槽位 | 一期页面尚未接这些接口 |

因此本 Mock 约定：

1. **视频**：有绑定则返回相对 LeRobot 的路径（前缀 `/datasets/{ds-id}/...`）；未绑定则占位 `/media/qc/{packageId}/...`  
2. **手轨迹**：`source: "prelabel_mock"`，用确定性公式生成双手 21 点（`image_normalized`），模拟 3D 预标产物，**不是**从 parquet 读出的真值  

接真后端后：`prelabel` 阶段写出轨迹 JSON/NPZ，本接口改为读存储；视频 URL 改为 MinIO / 静态服务地址。

---

## 1. 接口一览

| # | 方法（约定） | Mock 函数 | 说明 |
|---|--------------|-----------|------|
| 1 | `GET /api/v1/qc/packages/:id/playback` | `getQcPlayback(id)` | 播放清单：时长、fps、三路视频 URL、手轨迹元信息 |
| 2 | `GET /api/v1/qc/packages/:id/hand-trajectory` | `getQcHandTrajectory(id, query)` | 手轨迹帧列表（可按帧区间 + stride） |

### 与业务 4 接口的进页顺序

```text
并行：
  GET  /packages/:id                 → 顶栏
  GET  /packages/:id/annotations     → Tag / 问题 / 质量段
  GET  /packages/:id/playback        → 视频 URL + 轨迹元信息

播放 / 拖动时间轴时（可按需、可缓存）：
  GET  /packages/:id/hand-trajectory?startFrame=&endFrame=&stride=
```

### Mock 调用示例

```ts
import { getQcPlayback, getQcHandTrajectory } from '@/api/client'

const play = await getQcPlayback('dr2')
// play.cameras[i].url → <video src>
// play.handTrajectory.trajectoryPath → 提示用

const traj = await getQcHandTrajectory('dr2', {
  startFrame: 0,
  endFrame: 300,
  stride: 2,
})
// traj.frames[t].left / .right → 21 个 {x,y,z}，叠到画面上
```

---

## 2. 接口 1 — 播放清单

**`GET /api/v1/qc/packages/:id/playback`**  
**Mock：** `getQcPlayback(id)`

### 响应 `QcPlaybackManifest`

```json
{
  "packageId": "dr2",
  "fps": 30,
  "durationSec": 16.8,
  "frameCount": 504,
  "cameras": [
    {
      "key": "cam_left",
      "label": "Left · rectified",
      "role": "rectified_left",
      "width": 640,
      "height": 480,
      "codec": "av1",
      "url": "/datasets/ds-pen/videos/chunk-000/observation.images.cam_left/episode_000000.mp4"
    },
    {
      "key": "cam_right",
      "label": "Right · rectified",
      "role": "rectified_right",
      "width": 640,
      "height": 480,
      "codec": "av1",
      "url": "/datasets/ds-pen/videos/chunk-000/observation.images.cam_right/episode_000000.mp4"
    },
    {
      "key": "cam_high",
      "label": "High · overview + hand",
      "role": "overview",
      "width": 640,
      "height": 480,
      "codec": "av1",
      "url": "/datasets/ds-pen/videos/chunk-000/observation.images.cam_high/episode_000000.mp4"
    }
  ],
  "handTrajectory": {
    "source": "prelabel_mock",
    "landmarkCount": 21,
    "hands": ["left", "right"],
    "frameStride": 2,
    "space": "image_normalized",
    "trajectoryPath": "/api/v1/qc/packages/dr2/hand-trajectory"
  },
  "datasetRef": {
    "datasetId": "ds-pen",
    "datasetName": "black_pen_to_wooden_stand",
    "episodeIndex": 0,
    "localPath": "../black_pen_to_wooden_stand/lerobot_data"
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `cameras[].role` | 映射详情页槽位：左目 / 右目 / 俯视（手叠加优先画在 overview） |
| `cameras[].url` | 给播放器；**当前 Vite 未挂静态目录时浏览器打不开**，需后续 `vite` 静态代理或文件服务 |
| `handTrajectory.source` | `prelabel_mock` \| `prelabel` \| `none` |
| `handTrajectory.space` | `image_normalized`：`x,y ∈ [0,1]` 相对画面；`z` 为相对深度 |
| `handTrajectory.frameStride` | 建议拉轨迹时的默认步长（减流量） |
| `datasetRef` | 可选；有则表示视频来自本地 LeRobot episode |

### Mock 绑定表（可改 `qcPlayback.ts`）

| 质检包 id | 数据集 | episode |
|-----------|--------|---------|
| `dr2` | `ds-pen`（black_pen…） | 0 |
| `dr4` | `ds-mouse`（black_mouse…） | 0 |
| 其它 | 无 | 占位 URL `/media/qc/{id}/cam_*.mp4`，时长用 session |

未绑定包的 `durationSec` / `fps` 来自质检 session（默认 300s / 30fps）。

---

## 3. 接口 2 — 手轨迹

**`GET /api/v1/qc/packages/:id/hand-trajectory`**  
**Mock：** `getQcHandTrajectory(id, query)`

### Query

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `startFrame` | number | `0` | 含 |
| `endFrame` | number | `frameCount - 1` | 含 |
| `stride` | number | manifest 的 `frameStride`（Mock 默认 2） | 每隔多少帧取 1 点 |

### 响应 `HandTrajectoryResponse`

```json
{
  "packageId": "dr2",
  "fps": 30,
  "landmarkCount": 21,
  "startFrame": 0,
  "endFrame": 300,
  "stride": 2,
  "frames": [
    {
      "frameIndex": 0,
      "timeSec": 0,
      "left": [
        { "x": 0.17, "y": 0.4, "z": 0.0 }
      ],
      "right": [
        { "x": 0.53, "y": 0.4, "z": 0.0 }
      ],
      "confidence": 0.82
    }
  ]
}
```

说明：示例中 `left`/`right` 各应有 **21** 个点（文档省略中间点）。`null` 表示该帧该手不可见。

### 21 点顺序（与常见 hand landmark 一致，供画骨架）

```text
0 手腕
1–4   拇指
5–8   食指
9–12  中指
13–16 无名指
17–20 小指
```

前端可用 `frameIndex` 或 `timeSec` 与视频 `currentTime` 对齐；`stride>1` 时在两关键帧之间可线性插值。

### 和「手臂关节」的区别

| | 手轨迹（本接口） | LeRobot `observation.state` |
|--|------------------|------------------------------|
| 含义 | 双手 21 关键点（预标/HaMeR） | 双臂 14 关节角 |
| 用途 | 画面骨架叠加 | 机器人状态曲线（另接口，非本文件） |
| 本期 Mock | 有 | 未在质检播放接口暴露 |

---

## 4. 前端使用要点（接口层）

1. **先 `playback` 再 `hand-trajectory`**，用 `frameCount` / `fps` 约束区间，避免一次拉满超长序列。  
2. 建议按窗口拉取，例如当前时间前后 5s：`startFrame = (t-5)*fps`，`endFrame = (t+5)*fps`。  
3. 手叠加画在 `role === 'overview'`（cam_high）上即可；左右目也可复用同一轨迹（坐标若仅为 high 相机，需外参，二期再做）。  
4. 视频能否播取决于是否配置静态资源映射；接口只负责给 URL。

---

## 5. 真后端落地建议

| 能力 | 建议 |
|------|------|
| 视频 | MinIO / Nginx 静态；URL 签时或走网关 |
| 手轨迹 | 预标产物 `hand_trajectory/{episode}.json` 或按 chunk 存；接口做区间裁剪 |
| 与 LeRobot | `package.datasetId` + `episodeIndex` 持久化，替代 Mock 绑定表 |
| 性能 | 轨迹默认 stride=2～5；或返回二进制（MessagePack） |

---

## 6. 源码索引

| 内容 | 路径 |
|------|------|
| Mock | `src/mocks/qcPlayback.ts` |
| API | `getQcPlayback` / `getQcHandTrajectory` → `src/api/client.ts` |
| 类型 | `QcPlaybackManifest` / `HandPoseFrame` / `HandTrajectoryResponse` → `src/types/index.ts` |
| 视频元数据同源 | `src/mocks/lerobotDatasets.ts` |
