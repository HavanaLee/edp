# 质检详情（一期）Mock API 文档

> 面向 `QcDetailPage`（如 `/qc/dr2`）  
> 一期固定 **4 个接口**：轻量详情、读标注、保存草稿、终审  
> 实现：`src/api/client.ts` · 类型：`src/types/index.ts` · Mock：`src/mocks/data.ts`  
> 路径形如 `/api/v1/qc/...` 为约定契约；当前为前端内存 Mock（带 delay），未发真实 HTTP。

- 媒体（三路视频 + 手轨迹）见 [质检播放媒体API.md](./质检播放媒体API.md)（`getQcPlayback` / `getQcHandTrajectory`）  
- 数据集目录元信息见 [LeRobot数据集API.md](./LeRobot数据集API.md)  

上述媒体接口**不在**本文件 4 个业务接口内，进页建议与业务接口并行请求。

---

## 1. 接口一览

| # | 方法（约定） | Mock 函数 | 说明 |
|---|--------------|-----------|------|
| 1 | `GET /api/v1/qc/packages/:id` | `getQcPackageDetail(id)` | 包摘要 + 会话（不含 tags/issues/segments） |
| 2 | `GET /api/v1/qc/packages/:id/annotations` | `getQcAnnotations(id)` | Tag / 问题 / 质量区间 |
| 3 | `PUT /api/v1/qc/packages/:id/annotations` | `putQcAnnotations(id, body)` | 保存草稿（整表覆盖） |
| 4 | `POST /api/v1/qc/packages/:id/review` | `postQcReview(id, body)` | 终审：通过 / 驳回 |

`:id` 为质检包 ID（如 `dr2`），**不是** `dataId`（如 `ST0611-0618-RAW-002`）。

找不到资源时 Mock 返回 `null`（真后端建议 `404`）。

### 进页推荐调用顺序

```text
并行：
  GET  /packages/:id              → 顶栏、时长/fps
  GET  /packages/:id/annotations  → 时间轴、问题清单
  GET  /packages/:id/playback     → 三路视频 URL + 手轨迹元信息（见播放媒体文档）

播放中按需：
  GET  /packages/:id/hand-trajectory?startFrame=&endFrame=

用户点「保存」：
  PUT  /packages/:id/annotations

用户点「通过/驳回」：
  POST /packages/:id/review
  （建议先 PUT 再 POST，或由后端在 review 内接受最新 annotations）
```

### Mock 调用示例

```ts
import {
  getQcPackageDetail,
  getQcAnnotations,
  putQcAnnotations,
  postQcReview,
} from '@/api/client'

const detail = await getQcPackageDetail('dr2')
const annotations = await getQcAnnotations('dr2')

await putQcAnnotations('dr2', {
  tags: annotations!.tags,
  issues: annotations!.issues,
  qualitySegments: annotations!.qualitySegments,
})

await postQcReview('dr2', {
  decision: 'passed',
  note: '综合评级：高',
  quality: 'high',
})
```

---

## 2. 接口 1 — 轻量详情

**`GET /api/v1/qc/packages/:id`**  
**Mock：** `getQcPackageDetail(id)`

### 响应 `QcPackageDetail`

```json
{
  "package": {
    "id": "dr2",
    "dataId": "ST0611-0618-RAW-002",
    "name": "ST0611-0618-RAW-002",
    "dataStatus": "delivered",
    "scene": "kitchen",
    "sceneLabel": "厨房-取放物品",
    "tagCount": 13,
    "issueCount": 0,
    "version": "v2.1",
    "episodes": 1,
    "frames": 10300,
    "quality": "high",
    "qcStatus": "pending",
    "path": "s3://edp-bucket/ST0611-0618-RAW-002/",
    "createdAt": "2026-07-17T10:00:00",
    "note": null
  },
  "session": {
    "inspector": "刘洋",
    "durationSec": 300,
    "fps": 30,
    "lockKey": "lock:qc:ST0611-0618-RAW-002",
    "manualEdits": 1,
    "lowConfidenceCount": 6
  }
}
```

### 字段说明

**package（列表同源 `QcPackage`）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 路由/查找键 |
| `dataId` | string | 顶栏展示 ID |
| `dataStatus` | `prelabeled` \| `optimized` \| `delivered` | 数据流水线状态 |
| `qcStatus` | `pending` \| `passed` \| `rejected` | 质检状态 |
| `quality` | `high` \| `medium` \| `low` \| `pending` \| `null` | 综合质量；未评可为 null |
| `scene` / `sceneLabel` | string | 场景 |
| `tagCount` / `issueCount` | number | 列表用计数（保存草稿后会更新） |
| `episodes` / `frames` / `version` / `path` | — | 包级元信息 |

**session（播放与会话）**

| 字段 | 类型 | 说明 |
|------|------|------|
| `inspector` | string | 当前质检员 |
| `durationSec` | number | 时间轴总时长（秒） |
| `fps` | number | 帧率 |
| `lockKey` | string | 分布式锁标识（一期展示用） |
| `manualEdits` | number | 人工编辑次数（保存草稿会 +1） |
| `lowConfidenceCount` | number | 低置信 Tag 数（侧栏统计） |

---

## 3. 接口 2 — 读标注

**`GET /api/v1/qc/packages/:id/annotations`**  
**Mock：** `getQcAnnotations(id)`

### 响应 `QcAnnotations`

```json
{
  "tags": [
    {
      "id": "tag-1",
      "label": "取矿泉水",
      "startSec": 0,
      "endSec": 19.6,
      "confidence": 0.72,
      "edited": false
    }
  ],
  "issues": [
    {
      "id": "iss-1",
      "code": "hand_jitter",
      "severity": "medium",
      "title": "手部 3D 关节抖动明显，建议人工复核",
      "frameStart": 3224,
      "frameEnd": 8626,
      "author": "赵敏",
      "date": "07-12",
      "status": "ignored"
    }
  ],
  "qualitySegments": [
    { "id": "qs-1", "startSec": 0, "endSec": 120, "quality": "high" },
    { "id": "qs-2", "startSec": 120, "endSec": 180, "quality": "medium" },
    { "id": "qs-3", "startSec": 180, "endSec": 300, "quality": "high" }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `tags[]` | `QcTag` | 时间轴 Tag：`startSec`/`endSec`、置信度、是否已编辑 |
| `issues[]` | `QcIssue` | 问题清单：`status` 为 `open` \| `fixed` \| `ignored` |
| `qualitySegments[]` | `QcQualitySegment` | Q/W/E 质量区间；`quality` 为 `high` \| `medium` \| `low` |

`dr2` 有预置三段质量区间 + 1 条 issue；其它 id 由 Mock 按包的 `tagCount` / `issueCount` 生成。

---

## 4. 接口 3 — 保存草稿

**`PUT /api/v1/qc/packages/:id/annotations`**  
**Mock：** `putQcAnnotations(id, body)`

语义：**整表覆盖** tags / issues / qualitySegments（非 JSON Patch）。  
不改变 `qcStatus`（仍为 pending 等）；仅更新标注与计数。

### 请求体 `QcAnnotationsUpdate`

```json
{
  "tags": [ /* 完整 QcTag[] */ ],
  "issues": [ /* 完整 QcIssue[] */ ],
  "qualitySegments": [ /* 完整 QcQualitySegment[] */ ]
}
```

### 响应

与接口 2 相同：保存后的 `QcAnnotations`。

### Mock 副作用

- 写入内存 `qcDetailExtras[id]`
- `session.manualEdits += 1`
- `package.tagCount = tags.length`
- `package.issueCount = issues` 中 `status === 'open'` 的数量

---

## 5. 接口 4 — 终审

**`POST /api/v1/qc/packages/:id/review`**  
**Mock：** `postQcReview(id, body)`

语义：提交质检结论，更新包状态。与「保存草稿」分开。

### 请求体 `QcReviewPayload`

```json
{
  "decision": "passed",
  "note": "综合评级：高",
  "quality": "high"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `decision` | `passed` \| `rejected` | 通过 / 驳回 |
| `note` | string | 备注 |
| `quality` | `high` \| `medium` \| `low` \| `pending` | 综合质量（写入 `package.quality`） |

### 响应

更新后的完整 `QcPackage`。

### Mock 副作用

- `package.qcStatus = decision`
- `package.quality = quality`
- `package.note = note`
- `decision === 'passed'` 时 `package.issueCount = 0`

---

## 6. 与旧接口的关系

| 旧函数 | 状态 | 说明 |
|--------|------|------|
| `getQcDetail(id)` | 兼容保留 | 一次返回 `{ package, extra }`，`extra` = session 字段 + annotations |
| `reviewQcPackage(id, body)` | 兼容保留 | 内部转调 `postQcReview` |

新页面建议直接用一期 4 函数；旧 `QcDetailPage` 可暂继续 `getQcDetail`。

---

## 7. 错误约定（真后端）

| HTTP | 场景 |
|------|------|
| 200 | 成功 |
| 404 | `:id` 不存在 |
| 409 | 锁被占用 / 已终审不可再改（二期） |
| 422 | body 校验失败（区间重叠、时长越界等，二期） |

一期 Mock：失败统一 `null`，不抛业务错误码。

---

## 8. 源码索引

| 内容 | 路径 |
|------|------|
| Mock 函数 | `getQcPackageDetail` / `getQcAnnotations` / `putQcAnnotations` / `postQcReview` → `src/api/client.ts` |
| 类型 | `QcPackageDetail` / `QcSession` / `QcAnnotations` / `QcAnnotationsUpdate` / `QcReviewPayload` → `src/types/index.ts` |
| 数据 | `qcPackages` / `qcDetailExtras` → `src/mocks/data.ts` |
| 示例包 | `id=dr2`（预置 annotations） |
