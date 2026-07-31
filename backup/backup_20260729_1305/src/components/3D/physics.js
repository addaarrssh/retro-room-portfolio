import { DESK_TOP, ROOM } from './layout'
import audio from '../../audio/AudioEngine'

/* ==========================================================================
   physics.js — Physics Integrator for Throwable Room Props
   ========================================================================== */

const RESTITUTION = 0.35
const FRICTION = 0.91
const GRAVITY = -9.81
const THOCK_COOLDOWN_MS = 120

let lastThockTime = 0

export class PhysicsBody {
  constructor({
    position = [0, 0, 0],
    velocity = [0, 0, 0],
    rotation = [0, 0, 0],
    angularVelocity = [0, 0, 0],
    bounds = { minY: DESK_TOP, minX: -ROOM.halfX + 0.2, maxX: ROOM.halfX - 0.2, minZ: ROOM.backZ + 0.2, maxZ: 1.5 },
  }) {
    this.x = position[0]
    this.y = position[1]
    this.z = position[2]

    this.vx = velocity[0]
    this.vy = velocity[1]
    this.vz = velocity[2]

    this.rx = rotation[0]
    this.ry = rotation[1]
    this.rz = rotation[2]

    this.avx = angularVelocity[0]
    this.avy = angularVelocity[1]
    this.avz = angularVelocity[2]

    this.bounds = bounds
    this.isSleeping = false
  }

  update(dt) {
    if (this.isSleeping) return

    // Apply gravity
    this.vy += GRAVITY * dt

    // Update position
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.z += this.vz * dt

    // Update rotation
    this.rx += this.avx * dt
    this.ry += this.avy * dt
    this.rz += this.avz * dt

    // Apply air friction
    this.vx *= FRICTION
    this.vy *= FRICTION
    this.vz *= FRICTION
    this.avx *= FRICTION
    this.avy *= FRICTION
    this.avz *= FRICTION

    let collided = false

    // Floor / surface collision
    if (this.y <= this.bounds.minY) {
      this.y = this.bounds.minY
      if (Math.abs(this.vy) > 0.2) {
        collided = true
      }
      this.vy = -this.vy * RESTITUTION
      this.vx *= FRICTION
      this.vz *= FRICTION
    }

    // Boundary walls
    if (this.x < this.bounds.minX) {
      this.x = this.bounds.minX
      this.vx = -this.vx * RESTITUTION
      collided = true
    } else if (this.x > this.bounds.maxX) {
      this.x = this.bounds.maxX
      this.vx = -this.vx * RESTITUTION
      collided = true
    }

    if (this.z < this.bounds.minZ) {
      this.z = this.bounds.minZ
      this.vz = -this.vz * RESTITUTION
      collided = true
    } else if (this.z > this.bounds.maxZ) {
      this.z = this.bounds.maxZ
      this.vz = -this.vz * RESTITUTION
      collided = true
    }

    if (collided) {
      const now = performance.now()
      if (now - lastThockTime > THOCK_COOLDOWN_MS) {
        audio.thock()
        lastThockTime = now
      }
    }

    // Sleep check
    const speedSq = this.vx * this.vx + this.vy * this.vy + this.vz * this.vz
    if (speedSq < 0.001 && Math.abs(this.y - this.bounds.minY) < 0.005) {
      this.isSleeping = true
      this.vx = 0
      this.vy = 0
      this.vz = 0
    }
  }
}
