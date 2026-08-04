/**
 * 质检详情播放 Mock：三路视频清单 + 手部 21 点轨迹
 * - 视频路径优先绑定 LeRobot episode（与 black_* 对齐）
 * - 手轨迹：本地包无 HaMeR 产物，dr2 使用手工配置的逐相机 prelabel_mock 关键帧
 */
import { qcHandTrajectoryKeyframes } from '@/mocks/qcHandTrajectory'
import { findLerobotDataset } from '@/mocks/lerobotDatasets'
import { getOrCreateQcDetailExtra, qcPackages } from '@/mocks/data'
import type {
  HandPoseFrame,
  QcHandTrajectoryCameraRole,
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
  const hasTrajectory = Boolean(qcHandTrajectoryKeyframes[id])

  return {
    packageId: id,
    fps: built.fps,
    durationSec: built.durationSec,
    frameCount: built.frameCount,
    cameras: built.cameras,
    datasetRef: built.datasetRef,
    handTrajectory: {
      source: hasTrajectory ? 'prelabel_mock' : 'none',
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
  const framesByCamera: Record<QcHandTrajectoryCameraRole, HandPoseFrame[]> = {
    rectified_left: [],
    rectified_right: [],
  }
  const keyframes = qcHandTrajectoryKeyframes[id]

  if (keyframes) {
    for (const role of Object.keys(framesByCamera) as QcHandTrajectoryCameraRole[]) {
      framesByCamera[role] = keyframes[role]
        .filter((frame) => frame.frameIndex >= startFrame && frame.frameIndex <= endFrame)
        .map((frame) => ({
          ...frame,
          left: frame.left?.map((landmark) => ({ ...landmark })) ?? null,
          right: frame.right?.map((landmark) => ({ ...landmark })) ?? null,
        }))
    }
  }

  return {
    packageId: id,
    fps: manifest.fps,
    landmarkCount: LANDMARK_COUNT,
    startFrame,
    endFrame,
    stride,
    framesByCamera,
  }
}
