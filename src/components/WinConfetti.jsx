import { useEffect, useRef, useState } from 'react'

// Fired app-wide by any page when a check comes back with at least one winning combination.
// ScanPage dispatches it; this component owns the canvas overlay so the burst shows above
// result panels and small-screen modals alike.
export const WIN_EVENT = 'lottocam:win'

// Philippine flag colors, the app identity motif (DESIGN.md). Paper rectangles, not glitter.
const COLORS = ['#0038A8', '#CE1126', '#FCD116']
const MAX_LIFETIME_MS = 3800
const GRAVITY = 0.0026 // px/ms^2
const DRAG = 0.9994 // fraction of velocity kept per millisecond
const PARTICLE_COUNT = 150

// Velocities are in CSS pixels per millisecond so the motion is frame-rate independent.
function makeParticle(x, inward) {
  return {
    x,
    y: window.innerHeight + 12,
    vx: inward * (0.18 + Math.random() * 0.55),
    vy: -(1.25 + Math.random() * 0.95),
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.008,
    w: 6 + Math.random() * 5,
    h: 9 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.003 + Math.random() * 0.004,
    alive: true,
  }
}

export default function WinConfetti() {
  const canvasRef = useRef(null)
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)
  const frameRef = useRef(0)
  const startedRef = useRef(0)
  const lastRef = useRef(0)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    if (!context) return undefined

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * ratio)
      canvas.height = Math.round(window.innerHeight * ratio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function step(now) {
      if (!activeRef.current) return
      const dt = Math.min(32, now - lastRef.current)
      lastRef.current = now
      const elapsed = now - startedRef.current
      const drag = DRAG ** dt

      context.clearRect(0, 0, window.innerWidth, window.innerHeight)

      let living = 0
      for (const p of particlesRef.current) {
        if (!p.alive) continue
        p.sway += p.swaySpeed * dt
        p.vy += GRAVITY * dt
        p.vx *= drag
        p.vy *= drag
        p.x += (p.vx + Math.sin(p.sway) * 0.03) * dt
        p.y += p.vy * dt
        p.rot += p.vrot * dt
        if (p.y > window.innerHeight + 40 || p.x < -60 || p.x > window.innerWidth + 60) {
          p.alive = false
          continue
        }
        living += 1
        const squash = 0.2 + 0.8 * Math.abs(Math.cos(p.rot))
        context.save()
        context.translate(p.x, p.y)
        context.rotate(p.rot)
        context.scale(1, squash)
        context.fillStyle = p.color
        context.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        context.restore()
      }

      if (living === 0 || elapsed > MAX_LIFETIME_MS) {
        activeRef.current = false
        context.clearRect(0, 0, window.innerWidth, window.innerHeight)
        setActive(false)
        return
      }
      frameRef.current = requestAnimationFrame(step)
    }

    function fire() {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
      cancelAnimationFrame(frameRef.current)
      resize()
      const half = PARTICLE_COUNT / 2
      particlesRef.current = [
        ...Array.from({ length: half }, () => makeParticle(8, 1)),
        ...Array.from({ length: half }, () => makeParticle(window.innerWidth - 8, -1)),
      ]
      activeRef.current = true
      startedRef.current = performance.now()
      lastRef.current = startedRef.current
      setActive(true)
      frameRef.current = requestAnimationFrame(step)
    }

    window.addEventListener(WIN_EVENT, fire)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener(WIN_EVENT, fire)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameRef.current)
      activeRef.current = false
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="win-confetti"
      aria-hidden="true"
      hidden={!active}
    />
  )
}
