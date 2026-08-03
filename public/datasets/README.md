# Mock LeRobot 数据集（随仓库提交）

本目录供 `edp-web` 本地 Mock / 质检播放使用，已纳入 git，无需再依赖仓库外的

`../black_pen_to_wooden_stand` / `../black_mouse_to_wooden_stand`。

## 目录

| 路径 | 对应数据集 | Mock ID |
|------|------------|---------|
| `ds-pen/` | black_pen_to_wooden_stand | `ds-pen` |
| `ds-mouse/` | black_mouse_to_wooden_stand | `ds-mouse` |

每个目录即原 `lerobot_data/` 内容：

```text
ds-*/ 
├── meta/          # info.json、episodes.jsonl、tasks.jsonl …
├── data/chunk-000/          # episode_*.parquet
└── videos/chunk-000/
    ├── observation.images.cam_high/
    ├── observation.images.cam_left/
    └── observation.images.cam_right/
```

## 访问方式

Vite 会把 `public/` 映射到站点根路径，例如：

```text
/datasets/ds-pen/videos/chunk-000/observation.images.cam_left/episode_000000.mp4
/datasets/ds-mouse/meta/info.json
```

与 `getQcPlayback` / `getLerobotDataset` 返回的 URL、`localPath` 一致。

## 体积说明

两套合计约 **680MB**（含 20×3 路 mp4 + parquet）。若远程仓库对单仓体积敏感，可改用 Git LFS 跟踪 `*.mp4` / `*.parquet`，或只保留演示用的 `episode_000000`。

## 更新数据

从仓库根重新同步示例：

```powershell
robocopy ..\black_pen_to_wooden_stand\lerobot_data public\datasets\ds-pen /E
robocopy ..\black_mouse_to_wooden_stand\lerobot_data public\datasets\ds-mouse /E
```
