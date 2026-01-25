import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gamepad2, Trophy, RotateCcw, Squircle, Grid3X3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameType = "menu" | "snake" | "tetris" | "runner";

interface ArcadeModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArcadeMode({ isOpen, onClose }: ArcadeModeProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  useEffect(() => {
    if (isOpen) {
      setShowCelebration(true);
      setCurrentGame("menu");
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {showCelebration && <CelebrationAnimation />}
      
      <div className="relative z-10 w-[90vw] max-w-4xl h-[80vh] max-h-[600px] rounded-md overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(187_85%_42%/0.15),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(280_70%_55%/0.1),transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[hsl(187,85%,42%)] to-[hsl(280,70%,55%)] shadow-lg shadow-[hsl(187,85%,42%)/0.3]">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Arcade Mode</h2>
                <p className="text-xs text-white/50">Hidden Feature Unlocked</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70"
              data-testid="button-close-arcade"
            >
              <X className="w-5 h-5" />
            </Button>
          </header>

          <div className="flex-1 overflow-hidden p-4">
            {currentGame === "menu" && (
              <GameMenu onSelectGame={setCurrentGame} />
            )}
            {currentGame === "snake" && (
              <SnakeGame onBack={() => setCurrentGame("menu")} />
            )}
            {currentGame === "tetris" && (
              <TetrisGame onBack={() => setCurrentGame("menu")} />
            )}
            {currentGame === "runner" && (
              <RunnerGame onBack={() => setCurrentGame("menu")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CelebrationAnimation() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    size: 4 + Math.random() * 8,
    color: ["hsl(187,85%,42%)", "hsl(207,90%,54%)", "hsl(280,70%,55%)", "hsl(45,100%,60%)"][Math.floor(Math.random() * 4)]
  }));

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-celebration-particle"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-celebration-text">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Arcade Unlocked!
          </h1>
          <p className="text-white/70">You found the secret feature</p>
        </div>
      </div>
    </div>
  );
}

function GameMenu({ onSelectGame }: { onSelectGame: (game: GameType) => void }) {
  const games = [
    { id: "snake" as GameType, name: "Snake", description: "Classic snake game", icon: Squircle },
    { id: "tetris" as GameType, name: "Tetris", description: "Stack the blocks", icon: Grid3X3 },
    { id: "runner" as GameType, name: "Runner", description: "Jump over obstacles", icon: Zap },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      <p className="text-white/60 text-sm">Select a game to play</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className="group p-6 rounded-xl border border-white/10 bg-white/5 hover-elevate transition-all duration-300 text-left"
            data-testid={`button-game-${game.id}`}
          >
            <div className="mb-3 group-hover:scale-110 transition-transform">
              <game.icon className="w-10 h-10 text-[hsl(187,85%,42%)]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{game.name}</h3>
            <p className="text-sm text-white/50">{game.description}</p>
          </button>
        ))}
      </div>
      <p className="text-white/40 text-xs mt-4">Use arrow keys or WASD to play</p>
    </div>
  );
}

function SnakeGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("arcade-snake-highscore");
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameStateRef = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
  });

  const GRID_SIZE = 20;
  const CELL_SIZE = 20;

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      snake: [{ x: 10, y: 10 }],
      food: { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) },
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
    };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { direction } = gameStateRef.current;
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          if (direction.y !== 1) gameStateRef.current.nextDirection = { x: 0, y: -1 };
          break;
        case "arrowdown":
        case "s":
          if (direction.y !== -1) gameStateRef.current.nextDirection = { x: 0, y: 1 };
          break;
        case "arrowleft":
        case "a":
          if (direction.x !== 1) gameStateRef.current.nextDirection = { x: -1, y: 0 };
          break;
        case "arrowright":
        case "d":
          if (direction.x !== -1) gameStateRef.current.nextDirection = { x: 1, y: 0 };
          break;
        case " ":
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const gameLoop = setInterval(() => {
      if (gameOver || isPaused) return;

      const state = gameStateRef.current;
      state.direction = state.nextDirection;

      const head = state.snake[0];
      const newHead = {
        x: (head.x + state.direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + state.direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (state.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("arcade-snake-highscore", score.toString());
        }
        return;
      }

      state.snake.unshift(newHead);

      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        setScore(s => s + 10);
        state.food = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } else {
        state.snake.pop();
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
      }

      state.snake.forEach((seg, i) => {
        const gradient = ctx.createRadialGradient(
          seg.x * CELL_SIZE + CELL_SIZE / 2,
          seg.y * CELL_SIZE + CELL_SIZE / 2,
          0,
          seg.x * CELL_SIZE + CELL_SIZE / 2,
          seg.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE / 2
        );
        const alpha = 1 - (i / state.snake.length) * 0.5;
        gradient.addColorStop(0, `hsla(187, 85%, 52%, ${alpha})`);
        gradient.addColorStop(1, `hsla(187, 85%, 42%, ${alpha * 0.7})`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
          seg.x * CELL_SIZE + 2,
          seg.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
          4
        );
        ctx.fill();
        
        if (i === 0) {
          ctx.shadowColor = "hsl(187, 85%, 42%)";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.fillStyle = "hsl(280, 70%, 55%)";
      ctx.shadowColor = "hsl(280, 70%, 55%)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        state.food.x * CELL_SIZE + CELL_SIZE / 2,
        state.food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(gameLoop);
    };
  }, [gameOver, isPaused, score, highScore]);

  return (
    <GameContainer
      title="Snake"
      score={score}
      highScore={highScore}
      gameOver={gameOver}
      isPaused={isPaused}
      onBack={onBack}
      onRestart={resetGame}
    >
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="rounded-lg border border-white/10"
      />
    </GameContainer>
  );
}

function TetrisGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("arcade-tetris-highscore");
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const COLS = 10;
  const ROWS = 20;
  const CELL_SIZE = 20;

  const PIECES = [
    { shape: [[1, 1, 1, 1]], color: "hsl(187, 85%, 42%)" },
    { shape: [[1, 1], [1, 1]], color: "hsl(45, 100%, 60%)" },
    { shape: [[1, 1, 1], [0, 1, 0]], color: "hsl(280, 70%, 55%)" },
    { shape: [[1, 1, 1], [1, 0, 0]], color: "hsl(207, 90%, 54%)" },
    { shape: [[1, 1, 1], [0, 0, 1]], color: "hsl(25, 95%, 55%)" },
    { shape: [[1, 1, 0], [0, 1, 1]], color: "hsl(140, 70%, 45%)" },
    { shape: [[0, 1, 1], [1, 1, 0]], color: "hsl(0, 75%, 55%)" },
  ];

  const gameStateRef = useRef({
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    currentPiece: null as { shape: number[][]; color: string; x: number; y: number } | null,
    dropCounter: 0,
    lastTime: 0,
  });

  const spawnPiece = useCallback(() => {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: piece.shape.map(row => [...row]),
      color: piece.color,
      x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0,
    };
  }, []);

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      currentPiece: spawnPiece(),
      dropCounter: 0,
      lastTime: 0,
    };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  }, [spawnPiece]);

  useEffect(() => {
    if (!gameStateRef.current.currentPiece) {
      gameStateRef.current.currentPiece = spawnPiece();
    }
  }, [spawnPiece]);

  const collides = useCallback((piece: typeof gameStateRef.current.currentPiece, board: (string | null)[][]) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  }, []);

  const merge = useCallback((piece: typeof gameStateRef.current.currentPiece, board: (string | null)[][]) => {
    if (!piece) return;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = piece.y + y;
          const newX = piece.x + x;
          if (newY >= 0) {
            board[newY][newX] = piece.color;
          }
        }
      }
    }
  }, []);

  const clearLines = useCallback((board: (string | null)[][]) => {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== null)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        linesCleared++;
        y++;
      }
    }
    return linesCleared;
  }, []);

  const rotate = useCallback((shape: number[][]) => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        rotated[x][rows - 1 - y] = shape[y][x];
      }
    }
    return rotated;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      const state = gameStateRef.current;
      if (!state.currentPiece) return;

      switch (e.key.toLowerCase()) {
        case "arrowleft":
        case "a":
          state.currentPiece.x--;
          if (collides(state.currentPiece, state.board)) {
            state.currentPiece.x++;
          }
          break;
        case "arrowright":
        case "d":
          state.currentPiece.x++;
          if (collides(state.currentPiece, state.board)) {
            state.currentPiece.x--;
          }
          break;
        case "arrowdown":
        case "s":
          state.currentPiece.y++;
          if (collides(state.currentPiece, state.board)) {
            state.currentPiece.y--;
          }
          break;
        case "arrowup":
        case "w":
          const rotated = rotate(state.currentPiece.shape);
          const originalShape = state.currentPiece.shape;
          state.currentPiece.shape = rotated;
          if (collides(state.currentPiece, state.board)) {
            state.currentPiece.shape = originalShape;
          }
          break;
        case " ":
          while (!collides(state.currentPiece, state.board)) {
            state.currentPiece.y++;
          }
          state.currentPiece.y--;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let animationId: number;
    const gameLoop = (time: number) => {
      const state = gameStateRef.current;
      const deltaTime = time - state.lastTime;
      state.lastTime = time;

      if (!gameOver && !isPaused) {
        state.dropCounter += deltaTime;
        if (state.dropCounter > 500) {
          if (state.currentPiece) {
            state.currentPiece.y++;
            if (collides(state.currentPiece, state.board)) {
              state.currentPiece.y--;
              merge(state.currentPiece, state.board);
              const lines = clearLines(state.board);
              if (lines > 0) {
                const points = [0, 100, 300, 500, 800][lines] || 0;
                setScore(s => {
                  const newScore = s + points;
                  if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem("arcade-tetris-highscore", newScore.toString());
                  }
                  return newScore;
                });
              }
              state.currentPiece = spawnPiece();
              if (collides(state.currentPiece, state.board)) {
                setGameOver(true);
              }
            }
          }
          state.dropCounter = 0;
        }
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (state.board[y][x]) {
            ctx.fillStyle = state.board[y][x]!;
            ctx.shadowColor = state.board[y][x]!;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.roundRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      if (state.currentPiece) {
        const piece = state.currentPiece;
        ctx.fillStyle = piece.color;
        ctx.shadowColor = piece.color;
        ctx.shadowBlur = 10;
        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
              ctx.beginPath();
              ctx.roundRect(
                (piece.x + x) * CELL_SIZE + 1,
                (piece.y + y) * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2,
                3
              );
              ctx.fill();
            }
          }
        }
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [gameOver, isPaused, collides, merge, clearLines, rotate, spawnPiece, highScore]);

  return (
    <GameContainer
      title="Tetris"
      score={score}
      highScore={highScore}
      gameOver={gameOver}
      isPaused={isPaused}
      onBack={onBack}
      onRestart={resetGame}
    >
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        className="rounded-lg border border-white/10"
      />
    </GameContainer>
  );
}

function RunnerGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("arcade-runner-highscore");
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const WIDTH = 600;
  const HEIGHT = 200;
  const GROUND_Y = HEIGHT - 40;

  const gameStateRef = useRef({
    player: { x: 50, y: GROUND_Y, vy: 0, isJumping: false, width: 30, height: 40 },
    obstacles: [] as { x: number; width: number; height: number }[],
    speed: 5,
    lastObstacle: 0,
    frameCount: 0,
  });

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      player: { x: 50, y: GROUND_Y, vy: 0, isJumping: false, width: 30, height: 40 },
      obstacles: [],
      speed: 5,
      lastObstacle: 0,
      frameCount: 0,
    };
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        if (!isStarted && !gameOver) {
          setIsStarted(true);
          return;
        }
        const state = gameStateRef.current;
        if (!state.player.isJumping && !gameOver) {
          state.player.vy = -12;
          state.player.isJumping = true;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let animationId: number;
    const gameLoop = () => {
      const state = gameStateRef.current;

      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + state.player.height);
      ctx.lineTo(WIDTH, GROUND_Y + state.player.height);
      ctx.stroke();

      if (!isStarted || gameOver || isPaused) {
        const gradient = ctx.createLinearGradient(0, 0, state.player.width, state.player.height);
        gradient.addColorStop(0, "hsl(187, 85%, 52%)");
        gradient.addColorStop(1, "hsl(187, 85%, 42%)");
        ctx.fillStyle = gradient;
        ctx.shadowColor = "hsl(187, 85%, 42%)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(state.player.x, GROUND_Y, state.player.width, state.player.height, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!isStarted) {
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "16px system-ui";
          ctx.textAlign = "center";
          ctx.fillText("Press SPACE to start", WIDTH / 2, HEIGHT / 2);
        }

        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      state.frameCount++;

      if (state.player.isJumping) {
        state.player.vy += 0.6;
        state.player.y += state.player.vy;
        if (state.player.y >= GROUND_Y) {
          state.player.y = GROUND_Y;
          state.player.vy = 0;
          state.player.isJumping = false;
        }
      }

      if (state.frameCount - state.lastObstacle > 100 + Math.random() * 50) {
        const height = 20 + Math.random() * 30;
        state.obstacles.push({
          x: WIDTH,
          width: 15 + Math.random() * 15,
          height,
        });
        state.lastObstacle = state.frameCount;
      }

      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= state.speed;
        return obs.x + obs.width > 0;
      });

      for (const obs of state.obstacles) {
        const playerRight = state.player.x + state.player.width;
        const playerBottom = state.player.y + state.player.height;
        const obsRight = obs.x + obs.width;
        const obsTop = GROUND_Y + state.player.height - obs.height;

        if (
          playerRight > obs.x &&
          state.player.x < obsRight &&
          playerBottom > obsTop
        ) {
          setGameOver(true);
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("arcade-runner-highscore", score.toString());
          }
        }
      }

      if (state.frameCount % 10 === 0) {
        setScore(s => s + 1);
      }

      if (state.frameCount % 500 === 0) {
        state.speed += 0.5;
      }

      const playerGradient = ctx.createLinearGradient(
        state.player.x,
        state.player.y,
        state.player.x + state.player.width,
        state.player.y + state.player.height
      );
      playerGradient.addColorStop(0, "hsl(187, 85%, 52%)");
      playerGradient.addColorStop(1, "hsl(207, 90%, 54%)");
      ctx.fillStyle = playerGradient;
      ctx.shadowColor = "hsl(187, 85%, 42%)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(
        state.player.x,
        state.player.y,
        state.player.width,
        state.player.height,
        6
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      for (const obs of state.obstacles) {
        const obsY = GROUND_Y + state.player.height - obs.height;
        ctx.fillStyle = "hsl(280, 70%, 55%)";
        ctx.shadowColor = "hsl(280, 70%, 55%)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(obs.x, obsY, obs.width, obs.height, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [isStarted, gameOver, isPaused, score, highScore]);

  return (
    <GameContainer
      title="Runner"
      score={score}
      highScore={highScore}
      gameOver={gameOver}
      isPaused={isPaused}
      onBack={onBack}
      onRestart={resetGame}
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="rounded-lg border border-white/10"
      />
    </GameContainer>
  );
}

interface GameContainerProps {
  title: string;
  score: number;
  highScore: number;
  gameOver: boolean;
  isPaused: boolean;
  onBack: () => void;
  onRestart: () => void;
  children: React.ReactNode;
}

function GameContainer({
  title,
  score,
  highScore,
  gameOver,
  isPaused,
  onBack,
  onRestart,
  children,
}: GameContainerProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white/70"
          data-testid="button-back-to-menu"
        >
          Back to Menu
        </Button>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-white/50">Score</p>
            <p className="text-lg font-bold text-white">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/50">Best</p>
            <p className="text-lg font-bold text-[hsl(187,85%,42%)]">{highScore}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        {children}
        
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
            <h3 className="text-2xl font-bold text-white mb-2">
              {gameOver ? "Game Over" : "Paused"}
            </h3>
            {gameOver && score >= highScore && score > 0 && (
              <p className="text-[hsl(45,100%,60%)] text-sm mb-4">New High Score!</p>
            )}
            <Button
              onClick={onRestart}
              className="bg-gradient-to-r from-[hsl(187,85%,42%)] to-[hsl(207,90%,54%)]"
              data-testid="button-restart-game"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {gameOver ? "Play Again" : "Restart"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-white/40 text-xs">
        {title === "Runner" ? "Press SPACE or UP to jump" : "Arrow keys or WASD to move • SPACE to pause"}
      </p>
    </div>
  );
}
