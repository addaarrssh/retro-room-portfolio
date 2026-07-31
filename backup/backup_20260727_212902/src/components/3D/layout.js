/* ==========================================================================
   layout.js — the handful of measurements the room and the monitor must agree
   on. Everything is in metres, and the origin is the middle of the room at
   floor level.

   The screen numbers are the load-bearing ones: CameraRig parks the camera at
   z = 1.15 looking at [0, 1.25, 0], and SCREEN.h is sized so the tube fills
   roughly 85% of the frame at that distance with a 42° field of view. Change
   the fov or the camera distance and SCREEN.h has to move with it.
   ========================================================================== */

export const ROOM = {
  width: 6.0,
  height: 3.0,
  backZ: -1.35,
  frontZ: 2.6,
  halfX: 3.0,
}

export const DESK_TOP = 0.7

export const SCREEN = {
  w: 1.02,
  h: 0.765,
  y: 1.25,
  z: -0.028,
}

/** Virtual desktop resolution, mapped onto SCREEN.w by DesktopOS. */
export const SCREEN_PX = { w: 1024, h: 768 }

export const MONITOR = {
  bezel: { w: 1.24, h: 0.94, d: 0.12, y: 1.22, z: -0.09 },
  body: { w: 1.06, h: 0.82, d: 0.4, y: 1.22, z: -0.35 },
  base: { w: 0.62, h: 0.05, d: 0.36, y: 0.725, z: -0.3 },
}
