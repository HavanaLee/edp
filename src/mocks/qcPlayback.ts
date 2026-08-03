/**
 * 质检详情播放 Mock：三路视频清单 + 手部 21 点轨迹
 * - 视频路径优先绑定 LeRobot episode（与 black_* 对齐）
 * - 手轨迹：本地包无 HaMeR 产物，用确定性公式生成 prelabel_mock
 */
import { findLerobotDataset } from '@/mocks/lerobotDatasets'
import { getOrCreateQcDetailExtra, qcPackages } from '@/mocks/data'
import type {
  HandLandmark,
  HandPoseFrame,
  HandTrajectoryQuery,
  HandTrajectoryResponse,
  QcCameraStream,
  QcPackage,
  QcPlaybackManifest,
} from '@/types'

/** 质检包 → 本地数据集 episode（演示用；未绑定则用占位 URL） */
const mediaBindings: Record<string, { datasetId: string; episodeIndex: number }> = {
  dr2: { datasetId: 'ds-pen', episodeIndex: 0 },
  dr4: { datasetId: 'ds-mouse', episodeIndex: 0 },
}

const LANDMARK_COUNT = 21

function makeLandmark(t: number, handSign: number, i: number): HandLandmark {
  const phase = t * 2.2 + i * 0.15 + handSign
  return {
    x: 0.35 + handSign * 0.18 + Math.sin(phase) * 0.04 + (i % 5) * 0.01,
    y: 0.4 + Math.cos(phase * 0.9) * 0.08 + Math.floor(i / 5) * 0.03,
    z: Math.sin(phase * 1.3) * 0.05,
  }
}

function makeHand(t: number, handSign: number): HandLandmark[] {
  return Array.from({ length: LANDMARK_COUNT }, (_, i) => makeLandmark(t, handSign, i))
}

function buildCameras(pkg: QcPackage, binding?: { datasetId: string; episodeIndex: number }): {
  cameras: QcCameraStream[]
  datasetRef?: QcPlaybackManifest['datasetRef']
  frameCount: number
  durationSec: number
  fps: number
} {
  const extra = getOrCreateQcDetailExtra(pkg.id, pkg)
  let fps = extra.fps
  let durationSec = extra.durationSec
  let frameCount = Math.round(durationSec * fps)

  if (!binding) {
    return {
      fps,
      durationSec,
      frameCount,
      cameras: [
        {
          key: 'cam_left',
          label: 'Left · rectified',
          role: 'rectified_left',
          width: 640,
          height: 480,
          codec: 'av1',
          url: `/media/qc/${pkg.id}/cam_left.mp4`,
        },
        {
          key: 'cam_right',
          label: 'Right · rectified',
          role: 'rectified_right',
          width: 640,
          height: 480,
          codec: 'av1',
          url: `/media/qc/${pkg.id}/cam_right.mp4`,
        },
        {
          key: 'cam_high',
          label: 'High · overview',
          role: 'overview',
          width: 640,
          height: 480,
          codec: 'av1',
          url: `/media/qc/${pkg.id}/cam_high.mp4`,
        },
      ],
    }
  }

  const ds = findLerobotDataset(binding.datasetId)
  const ep = ds?.episodes.find((e) => e.episodeIndex === binding.episodeIndex)
  if (!ds || !ep) {
    return buildCameras(pkg, undefined)
  }

  fps = ds.fps
  frameCount = ep.length
  durationSec = ep.durationSec

  const prefix = `/datasets/${ds.id}`
  return {
    fps,
    durationSec,
    frameCount,
    datasetRef: {
      datasetId: ds.id,
      datasetName: ds.name,
      episodeIndex: ep.episodeIndex,
      localPath: ds.localPath,
    },
    cameras: [
      {
        key: 'cam_left',
        label: 'Left · rectified',
        role: 'rectified_left',
        width: 640,
        height: 480,
        codec: 'av1',
        url: `${prefix}/${ep.videos.camLeft}`,
      },
      {
        key: 'cam_right',
        label: 'Right · rectified',
        role: 'rectified_right',
        width: 640,
        height: 480,
        codec: 'av1',
        url: `${prefix}/${ep.videos.camRight}`,
      },
      {
        key: 'cam_high',
        label: 'High · overview + hand',
        role: 'overview',
        width: 640,
        height: 480,
        codec: 'av1',
        url: `${prefix}/${ep.videos.camHigh}`,
      },
    ],
  }
}

export function buildQcPlaybackManifest(id: string): QcPlaybackManifest | null {
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null

  const binding = mediaBindings[id]
  const built = buildCameras(pkg, binding)
  const stride = 2

  return {
    packageId: id,
    fps: built.fps,
    durationSec: built.durationSec,
    frameCount: built.frameCount,
    cameras: built.cameras,
    datasetRef: built.datasetRef,
    handTrajectory: {
      source: 'prelabel_mock',
      landmarkCount: LANDMARK_COUNT,
      hands: ['left', 'right'],
      frameStride: stride,
      space: 'image_normalized',
      trajectoryPath: `/api/v1/qc/packages/${id}/hand-trajectory`,
    },
  }
}

export function buildHandTrajectory(
  id: string,
  query: HandTrajectoryQuery = {},
): HandTrajectoryResponse | null {
  const manifest = buildQcPlaybackManifest(id)
  if (!manifest) return null

  const stride = Math.max(1, query.stride ?? manifest.handTrajectory.frameStride)
  const startFrame = Math.max(0, query.startFrame ?? 0)
  const endFrame = Math.min(manifest.frameCount - 1, query.endFrame ?? manifest.frameCount - 1)
  const frames: HandPoseFrame[] = []

  for (let f = startFrame; f <= endFrame; f += stride) {
    const timeSec = Math.round((f / manifest.fps) * 100) / 100
    frames.push({
      frameIndex: f,
      timeSec,
      left: makeHand(timeSec, -1),
      right: makeHand(timeSec, 1),
      confidence: 0.82 + ((f % 17) / 100),
    })
  }

  return {
    packageId: id,
    fps: manifest.fps,
    landmarkCount: LANDMARK_COUNT,
    startFrame,
    endFrame,
    stride,
    frames,
  }
}
