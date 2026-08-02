import { useEffect, useRef, useState } from 'react'

export type Size = { width: number; height: number }

/**
 * 监听 DOM 尺寸变化（窗口缩放、侧栏折叠、flex 重排都会触发）。
 * 比只听 window.resize 更准。
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (width: number, height: number) => {
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      )
    }

    update(el.clientWidth, el.clientHeight)

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      update(width, height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}

/**
 * 在容器内按视频比例做 object-fit: contain，返回内容区位置与缩放。
 * 手部 canvas / 归一化坐标应基于 content 的 width/height，而不是容器。
 */
export function fitContain(
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
) {
  if (containerW <= 0 || containerH <= 0 || videoW <= 0 || videoH <= 0) {
    return { x: 0, y: 0, width: 0, height: 0, scale: 0 }
  }
  const scale = Math.min(containerW / videoW, containerH / videoH)
  const width = videoW * scale
  const height = videoH * scale
  const x = (containerW - width) / 2
  const y = (containerH - height) / 2
  return { x, y, width, height, scale }
}
