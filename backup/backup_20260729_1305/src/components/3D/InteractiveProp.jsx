import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

/* ==========================================================================
   InteractiveProp — wraps anything in the room that opens something.

   The point of this component is to close the gap that made the room feel
   like scenery. Before it, the 3D was a lobby you walked through to reach a
   monitor, and every object in it was set dressing: the ROC poster on the
   wall described a project you could only read about somewhere else.

   Now the objects ARE the navigation. Click the ROC print and Projects.app
   opens on RailCross. Click the shelf and About opens. The room stops being a
   thing you pass through and starts being the index.

   Affordance is deliberately quiet — a small lift, a warm emissive edge and a
   label near the cursor. Anything louder (outlines, pulsing) turns a calm
   studio back into a game level.
   ========================================================================== */

export default function InteractiveProp({
  children,
  label,
  hint,
  onSelect,
  onHover,
  enabled = true,
  lift = 0.012,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)
  const baseY = position[1]

  useEffect(() => {
    if (!enabled && hovered) setHovered(false)
  }, [enabled, hovered])

  useEffect(() => {
    if (!hovered || !enabled) return undefined
    document.body.style.cursor = 'pointer'
    onHover?.({ label, hint })
    return () => {
      document.body.style.cursor = 'auto'
      onHover?.(null)
    }
  }, [hovered, enabled, label, hint, onHover])

  useFrame((_, delta) => {
    if (!group.current) return
    const k = 1 - Math.pow(0.0015, delta)
    const targetY = hovered && enabled ? baseY + lift : baseY
    group.current.position.y = MathUtils.lerp(group.current.position.y, targetY, k)

    // Emissive lift on every standard material underneath, so the whole prop
    // responds rather than just the mesh the pointer happens to be over.
    const target = hovered && enabled ? 0.22 : 0
    group.current.traverse((o) => {
      if (o.isMesh && o.material && 'emissiveIntensity' in o.material) {
        o.material.emissiveIntensity = MathUtils.lerp(o.material.emissiveIntensity, target, k)
      }
    })
  })

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (enabled) setHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (enabled) onSelect?.()
      }}
    >
      {children}
    </group>
  )
}
