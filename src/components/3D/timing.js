/* Flight timings, shared by the camera rig (which flies) and App (which
   advances the view state when the flight lands). Kept in a file with no
   imports so App can read them without pulling three.js into the first chunk. */

/** Room → seated at the monitor. */
export const SIT_MS = 1500
/** Seated → back in the room. */
export const STAND_MS = 1250
/** The reveal after START: the camera glides in from a wide, high shot. */
export const INTRO_MS = 2600
