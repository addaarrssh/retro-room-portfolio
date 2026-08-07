import { useState, useEffect, useRef } from 'react'
import audio from '../../audio/AudioEngine'

export default function TypewriterText({
  text = '',
  speed = 40,
  delay = 0,
  playSound = true,
  cursor = true,
  cursorChar = '_',
  onComplete,
  className = '',
  as: Component = 'span',
  ...props
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef(null)
  const delayTimerRef = useRef(null)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)

    if (timerRef.current) clearTimeout(timerRef.current)
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current)

    if (!text) return

    delayTimerRef.current = setTimeout(() => {
      let charIndex = 0

      const typeNextChar = () => {
        if (charIndex < text.length) {
          const char = text[charIndex]
          setDisplayedText(text.slice(0, charIndex + 1))

          if (playSound && char.trim() !== '') {
            try {
              audio.keyClick()
            } catch {
              /* audio not unlocked yet */
            }
          }

          charIndex++
          const jitter = Math.random() * 10 - 5
          timerRef.current = setTimeout(typeNextChar, Math.max(15, speed + jitter))
        } else {
          setIsComplete(true)
          if (onComplete) onComplete()
        }
      }

      typeNextChar()
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
    }
  }, [text, speed, delay, playSound, onComplete])

  return (
    <Component className={`typewriter-container inline-block ${className}`} {...props}>
      <span>{displayedText}</span>
      {cursor && !isComplete && (
        <span className="typewriter-cursor ml-0.5 inline-block font-mono text-emerald-400 font-bold animate-pulse">
          {cursorChar}
        </span>
      )}
    </Component>
  )
}
