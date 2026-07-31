import { useState, useEffect, useRef } from 'react'
import { Gamepad2, RotateCcw } from 'lucide-react'

export default function ArcadeApp() {
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const GRID_SIZE = 15
  const [snake, setSnake] = useState([{ x: 7, y: 7 }])
  const [food, setFood] = useState({ x: 3, y: 3 })
  const [dir, setDir] = useState({ x: 1, y: 0 })

  /* Food must not land on the snake. Spawning blind meant it regularly
     appeared under the body, where it looked like it had vanished — and if it
     landed under the head's next cell it was swallowed instantly for a free
     point. Rejection-sample the free cells, with a bounded number of tries and
     a deterministic sweep as the fallback so a nearly-full board still ends. */
  const generateFood = (occupied = []) => {
    const taken = new Set(occupied.map((s) => `${s.x},${s.y}`))

    for (let i = 0; i < 60; i++) {
      const cell = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
      if (!taken.has(`${cell.x},${cell.y}`)) return cell
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!taken.has(`${x},${y}`)) return { x, y }
      }
    }
    return null // board full: the player has won
  }

  const resetGame = () => {
    const start = [{ x: 7, y: 7 }]
    setSnake(start)
    setFood(generateFood(start))
    setDir({ x: 1, y: 0 })
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const handleKeyDown = (e) => {
      if (e.key.startsWith('Arrow')) e.preventDefault()
      if (['ArrowUp', 'w', 'W'].includes(e.key) && dir.y === 0) setDir({ x: 0, y: -1 })
      if (['ArrowDown', 's', 'S'].includes(e.key) && dir.y === 0) setDir({ x: 0, y: 1 })
      if (['ArrowLeft', 'a', 'A'].includes(e.key) && dir.x === 0) setDir({ x: -1, y: 0 })
      if (['ArrowRight', 'd', 'D'].includes(e.key) && dir.x === 0) setDir({ x: 1, y: 0 })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dir, gameStarted, gameOver])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const interval = setInterval(() => {
      /* Decide the whole tick out here, then commit. A state updater must be
         a pure function of its input — React is free to call it more than
         once, and the previous version raised the score and respawned the food
         from inside setSnake, so a single pellet could be counted twice. */
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

      const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE
      // The tail cell is vacated this tick, so moving into it is legal.
      const body = snake.length > 1 ? snake.slice(0, -1) : snake
      const hitSelf = body.some((s) => s.x === head.x && s.y === head.y)

      if (hitWall || hitSelf) {
        setGameOver(true)
        setHighScore((hi) => Math.max(hi, score))
        return
      }

      const ate = food && head.x === food.x && head.y === food.y
      const next = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)]

      setSnake(next)
      if (ate) {
        setScore((s) => s + 10)
        setFood(generateFood(next))
      }
    }, 150)

    return () => clearInterval(interval)
  }, [dir, food, snake, gameStarted, gameOver, score])

  return (
    <div className="h-full w-full overflow-hidden p-6 text-[13px] leading-relaxed opacity-90 flex flex-col items-center justify-between select-none">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <Gamepad2 size={18} />
          <span>Retro Snake Arcade</span>
        </div>
        <div className="text-xs font-bold text-amber-400">
          SCORE: {score} | HIGH: {highScore}
        </div>
      </div>

      {/* Game Board Grid */}
      <div className="relative border-2 border-emerald-500/40 bg-black rounded p-1 shadow-inner my-auto">
        <div
          className="grid gap-[1px] bg-current/[0.06]"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: '240px',
            height: '240px',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE
            const y = Math.floor(i / GRID_SIZE)
            const isSnake = snake.some((s) => s.x === x && s.y === y)
            const isHead = snake[0].x === x && snake[0].y === y
            // food is null once the board is full — there is nowhere left to put it.
            const isFood = food != null && food.x === x && food.y === y

            return (
              <div
                key={i}
                className={`rounded-[1px] ${
                  isHead
                    ? 'bg-emerald-400 border border-emerald-200'
                    : isSnake
                    ? 'bg-emerald-600'
                    : isFood
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-current/[0.04]/80'
                }`}
              />
            )
          })}
        </div>

        {/* Start / Game Over Overlay */}
        {(!gameStarted || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-center">
            <h2 className="text-base font-bold text-emerald-400 mb-1">
              {gameOver ? 'GAME OVER!' : 'RETRO ARCADE'}
            </h2>
            <p className="text-xs opacity-90 mb-4">
              {gameOver ? `Final Score: ${score}` : 'Use Arrow Keys or WASD to move'}
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition active:scale-95"
            >
              <RotateCcw size={14} />
              <span>{gameOver ? 'PLAY AGAIN' : 'START GAME'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-[11px] opacity-50 text-center mt-2">
        Controls: Arrow Keys or WASD
      </div>
    </div>
  )
}
