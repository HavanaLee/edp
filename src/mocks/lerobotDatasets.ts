/**
 * 本地 black_pen / black_mouse 两套 LeRobot v2.1 数据集 Mock
 * 数值与 meta/info.json、meta/episodes.jsonl、meta/tasks.jsonl 对齐
 */
import type { DeliveryDataset, LerobotCamera, LerobotDataset, LerobotEpisode } from '@/types'

const CAMERAS: LerobotCamera[] = [
  {
    key: 'observation.images.cam_high',
    label: '俯视高机位',
    width: 640,
    height: 480,
    codec: 'av1',
    fps: 30,
    channels: 3,
  },
  {
    key: 'observation.images.cam_left',
    label: '左腕相机',
    width: 640,
    height: 480,
    codec: 'av1',
    fps: 30,
    channels: 3,
  },
  {
    key: 'observation.images.cam_right',
    label: '右腕相机',
    width: 640,
    height: 480,
    codec: 'av1',
    fps: 30,
    channels: 3,
  },
]

const FEATURE_KEYS = [
  'observation.state',
  'action',
  'observation.velocity',
  'observation.effort',
  'observation.images.cam_high',
  'observation.images.cam_left',
  'observation.images.cam_right',
  'timestamp',
  'frame_index',
  'episode_index',
  'index',
  'task_index',
]

function padEpisode(index: number) {
  return String(index).padStart(6, '0')
}

function buildEpisodes(
  task: string,
  lengths: number[],
): LerobotEpisode[] {
  return lengths.map((length, episodeIndex) => {
    const ep = padEpisode(episodeIndex)
    return {
      episodeIndex,
      length,
      durationSec: Math.round((length / 30) * 100) / 100,
      task,
      chunk: 0,
      dataPath: `data/chunk-000/episode_${ep}.parquet`,
      videos: {
        camHigh: `videos/chunk-000/observation.images.cam_high/episode_${ep}.mp4`,
        camLeft: `videos/chunk-000/observation.images.cam_left/episode_${ep}.mp4`,
        camRight: `videos/chunk-000/observation.images.cam_right/episode_${ep}.mp4`,
      },
    }
  })
}

/** pen: meta/episodes.jsonl 的 length 字段 */
const PEN_LENGTHS = [
  504, 754, 457, 415, 415, 532, 483, 535, 562, 517, 881, 1005, 943, 886, 1031, 1284, 1092, 1056,
  1272, 1044,
]

/** mouse: meta/episodes.jsonl 的 length 字段 */
const MOUSE_LENGTHS = [
  491, 460, 790, 423, 540, 486, 539, 624, 427, 591, 1083, 890, 985, 1035, 965, 1274, 1128, 1188,
  1258, 1246,
]

const PEN_TASK = 'Pick up the black_pen and place it on the wooden_stand.'
const MOUSE_TASK = 'Pick up the black mouse and put it on the wooden stand.'

export const lerobotDatasets: LerobotDataset[] = [
  {
    id: 'ds-pen',
    name: 'black_pen_to_wooden_stand',
    task: PEN_TASK,
    version: 'v2.1',
    robotType: 'aloha',
    fps: 30,
    totalEpisodes: 20,
    totalFrames: 15668,
    totalVideos: 60,
    totalChunks: 1,
    chunksSize: 1000,
    splits: { train: '0:20' },
    dataPathTemplate: 'data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet',
    videoPathTemplate: 'videos/chunk-{episode_chunk:03d}/{video_key}/episode_{episode_index:06d}.mp4',
    localPath: '../black_pen_to_wooden_stand/lerobot_data',
    cameras: CAMERAS,
    featureKeys: FEATURE_KEYS,
    qcStatus: 'pending',
    episodes: buildEpisodes(PEN_TASK, PEN_LENGTHS),
  },
  {
    id: 'ds-mouse',
    name: 'black_mouse_to_wooden_stand',
    task: MOUSE_TASK,
    version: 'v2.1',
    robotType: 'aloha',
    fps: 30,
    totalEpisodes: 20,
    totalFrames: 16423,
    totalVideos: 60,
    totalChunks: 1,
    chunksSize: 1000,
    splits: { train: '0:20' },
    dataPathTemplate: 'data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet',
    videoPathTemplate: 'videos/chunk-{episode_chunk:03d}/{video_key}/episode_{episode_index:06d}.mp4',
    localPath: '../black_mouse_to_wooden_stand/lerobot_data',
    cameras: CAMERAS,
    featureKeys: FEATURE_KEYS,
    qcStatus: 'passed',
    episodes: buildEpisodes(MOUSE_TASK, MOUSE_LENGTHS),
  },
]

/** 兼容旧交付列表 DeliveryDataset */
export function toDeliveryDataset(ds: LerobotDataset): DeliveryDataset {
  return {
    id: ds.id,
    name: ds.name,
    task: ds.task,
    version: ds.version,
    episodes: ds.totalEpisodes,
    frames: ds.totalFrames,
    videos: ds.totalVideos,
    fps: ds.fps,
    robotType: ds.robotType,
    path: ds.localPath,
    qcStatus: ds.qcStatus,
  }
}

export function findLerobotDataset(idOrName: string): LerobotDataset | undefined {
  return lerobotDatasets.find((d) => d.id === idOrName || d.name === idOrName)
}
