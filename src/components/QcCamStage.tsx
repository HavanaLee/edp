import { useEffect, useRef, useState } from 'react'
import { HandCanvas } from '@/components/HandCanvas'
import { fitContain, useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/utils'
import type { HandPoseFrame } from '@/types'

type Props = {
  title: string
  hint: string
  videoUrl?: string
  videoWidth?: number
  videoHeight?: number
  currentSec: number
  /** 视频实际时长；质检时间轴可能更长，播到头后停在末帧 */
  mediaDuration?: number
  playing: boolean
  fps: number
  frames: HandPoseFrame[]
  stride?: number
  /** 左目作时钟：仅当视频时长≈时间轴时长时使用 */
  isClock?: boolean
  onClockTime?: (sec: number) => void
  onEnded?: () => void
  className?: string
}

export function QcCamStage({
  title,
  hint,
  videoUrl,
  videoWidth = 640,
  videoHeight = 480,
  currentSec,
  mediaDuration,
  playing,
  fps,
  frames,
  stride = 2,
  isClock = false,
  onClockTime,
  onEnded,
  className,
}: Props) {
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>()
  const content = fitContain(stageSize.width, stageSize.height, videoWidth, videoHeight)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const clampSec = (sec: number) => {
    if (mediaDuration == null) return sec
    return Math.min(Math.max(0, sec), Math.max(0, mediaDuration - 0.01))
  }

  // 播放 / 暂停：超过视频时长时暂停在末帧
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    if (playing && (mediaDuration == null || currentSec < mediaDuration - 0.05)) {
      void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [playing, videoUrl, currentSec, mediaDuration])

  // 跟随 currentSec（时钟路播放中不抢 currentTime）
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    if (isClock && playing && (mediaDuration == null || currentSec < mediaDuration - 0.05)) return
    const target = clampSec(currentSec)
    if (Math.abs(v.currentTime - target) > 0.08) {
      v.currentTime = target
    }
  }, [currentSec, videoUrl, isClock, playing, mediaDuration])

  return (
    <div
      ref={stageRef}
      className={cn(
        'qc-detail-image relative overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a101c]',
        className,
      )}
    >
      <div
        className="qc-detail-image__content absolute overflow-hidden bg-black"
        style={{
          left: content.x,
          top: content.y,
          width: content.width,
          height: content.height,
        }}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-fill"
            src={videoUrl}
            muted
            playsInline
            preload="auto"
            onError={() =>
              setMediaError('视频无法播放（路径或编解码器）。手轨迹仍可叠加显示。')
            }
            onLoadedData={() => setMediaError(null)}
            onTimeUpdate={
              isClock
                ? () => {
                    const v = videoRef.current
                    if (!v || !playing) return
                    onClockTime?.(v.currentTime)
                  }
                : undefined
            }
            onEnded={() => {
              if (isClock) onEnded?.()
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_45%),linear-gradient(180deg,#111827_0%,#0b1220_100%)]" />
        )}

        <HandCanvas
          className="absolute inset-0 h-full w-full"
          currentSec={currentSec}
          fps={fps}
          frames={frames}
          stride={stride}
        />

        {!videoUrl || mediaError ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 p-3 text-center">
            <div className="text-sm text-slate-300">{hint}</div>
            <div className="text-[11px] text-slate-500">
              {mediaError ?? '未绑定视频，仅显示手轨迹 Mock'}
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/50 px-2 py-0.5 text-[11px] text-slate-200">
        {title}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
        {Math.round(content.width)}×{Math.round(content.height)}
      </div>
    </div>
  )
}
