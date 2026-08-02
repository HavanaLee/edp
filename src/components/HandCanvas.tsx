import { useEffect, useRef } from 'react'
import type { HandLandmark, HandPoseFrame } from '@/types'

/** MediaPipe / HaMeR 常见 21 点连线（手腕→指尖） */
const HAND_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
]

type Props = {
  currentSec: number
  fps: number
  frames: HandPoseFrame[]
  stride?: number
  className?: string
}

function findNeighborFrames(frames: HandPoseFrame[], frameIndex: number, stride: number) {
  if (frames.length === 0) return null

  let prev = frames[0]
  let next = frames[frames.length - 1]
  for (const f of frames) {
    if (f.frameIndex <= frameIndex) prev = f
    if (f.frameIndex >= frameIndex) {
      next = f
      break
    }
  }
  if (prev.frameIndex === next.frameIndex) return { prev, next, t: 0 }

  const span = Math.max(stride, next.frameIndex - prev.frameIndex)
  const t = (frameIndex - prev.frameIndex) / span
  return { prev, next, t: Math.min(1, Math.max(0, t)) }
}

function lerpLandmark(a: HandLandmark, b: HandLandmark, t: number): HandLandmark {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

function lerpHand(
  a: HandLandmark[] | null,
  b: HandLandmark[] | null,
  t: number,
): HandLandmark[] | null {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a
  const n = Math.min(a.length, b.length)
  return Array.from({ length: n }, (_, i) => lerpLandmark(a[i], b[i], t))
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  hand: HandLandmark[],
  width: number,
  height: number,
  color: string,
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  for (const [i, j] of HAND_EDGES) {
    const p = hand[i]
    const q = hand[j]
    if (!p || !q) continue
    ctx.beginPath()
    ctx.moveTo(p.x * width, p.y * height)
    ctx.lineTo(q.x * width, q.y * height)
    ctx.stroke()
  }

  for (const p of hand) {
    ctx.beginPath()
    ctx.arc(p.x * width, p.y * height, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * 透明手部叠加层：盖在 <video> 上方。
 * 轨迹 space 为 image_normalized（x,y ∈ [0,1]）。
 */
export function HandCanvas({ currentSec, fps, frames, stride = 2, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const drawArgsRef = useRef({ currentSec, fps, frames, stride })
  drawArgsRef.current = { currentSec, fps, frames, stride }

  const paint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width: cssW, height: cssH } = sizeRef.current
    if (cssW <= 0 || cssH <= 0) return

    const { currentSec: t, fps: f, frames: fr, stride: s } = drawArgsRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(cssW * dpr)
    canvas.height = Math.floor(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const frameIndex = Math.max(0, Math.floor(t * f))
    const pair = findNeighborFrames(fr, frameIndex, s)
    if (!pair) return

    const left = lerpHand(pair.prev.left, pair.next.left, pair.t)
    const right = lerpHand(pair.prev.right, pair.next.right, pair.t)
    if (left) drawHand(ctx, left, cssW, cssH, '#38bdf8')
    if (right) drawHand(ctx, right, cssW, cssH, '#a78bfa')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      sizeRef.current = { width: rect.width, height: rect.height }
      paint()
    })
    ro.observe(parent)
    sizeRef.current = { width: parent.clientWidth, height: parent.clientHeight }
    paint()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    paint()
  }, [currentSec, fps, frames, stride])

  return <canvas ref={canvasRef} className={className} style={{ pointerEvents: 'none' }} />
}
