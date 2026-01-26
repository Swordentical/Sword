import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Gamepad2, Trophy, RotateCcw, Squircle, Grid3X3, Zap, Volume2, VolumeX, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

type GameType = "menu" | "snake" | "tetris" | "runner";

interface ArcadeModeProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArcadeContentProps {
  onClose: () => void;
  showCelebration: boolean;
  embedded?: boolean;
}

function TouchControls({ onDirection, showRotate, onRotate }: { 
  onDirection: (dir: "up" | "down" | "left" | "right") => void;
  showRotate?: boolean;
  onRotate?: () => void;
}) {
  return (
    <div className="flex justify-center gap-2 mt-3 md:hidden">
      <div className="grid grid-cols-3 gap-1">
        <div />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 bg-white/10 border border-white/20"
          onTouchStart={(e) => { e.preventDefault(); onDirection("up"); }}
          data-testid="touch-up"
        >
          <ChevronUp className="h-5 w-5 text-white" />
        </Button>
        <div />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 bg-white/10 border border-white/20"
          onTouchStart={(e) => { e.preventDefault(); onDirection("left"); }}
          data-testid="touch-left"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </Button>
        {showRotate && onRotate ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-white/20 border border-white/30"
            onTouchStart={(e) => { e.preventDefault(); onRotate(); }}
            data-testid="touch-rotate"
          >
            <RotateCcw className="h-4 w-4 text-white" />
          </Button>
        ) : (
          <div />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 bg-white/10 border border-white/20"
          onTouchStart={(e) => { e.preventDefault(); onDirection("right"); }}
          data-testid="touch-right"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </Button>
        <div />
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 bg-white/10 border border-white/20"
          onTouchStart={(e) => { e.preventDefault(); onDirection("down"); }}
          data-testid="touch-down"
        >
          <ChevronDown className="h-5 w-5 text-white" />
        </Button>
        <div />
      </div>
    </div>
  );
}

function JumpButton({ onJump }: { onJump: () => void }) {
  return (
    <div className="flex justify-center mt-3 md:hidden">
      <Button
        variant="ghost"
        className="h-16 w-32 bg-white/10 border border-white/20 text-white font-bold text-lg"
        onTouchStart={(e) => { e.preventDefault(); onJump(); }}
        data-testid="touch-jump"
      >
        JUMP
      </Button>
    </div>
  );
}

function ArcadeContent({ onClose, showCelebration, embedded = false }: ArcadeContentProps) {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const handleSelectGame = useCallback((game: GameType) => {
    sounds.menuSelect();
    if (game !== "menu") {
      sounds.gameStart();
    }
    setCurrentGame(game);
  }, []);

  const handleClose = useCallback(() => {
    sounds.arcadeClose();
    onClose();
  }, [onClose]);

  return (
    <div className={cn(
      "relative flex flex-col h-full rounded-md overflow-hidden border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
      embedded ? "shadow-lg" : "shadow-2xl"
    )}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.03),transparent_50%)]" />
      
      {showCelebration && <CelebrationAnimation />}
      
      <div className="relative z-10 flex flex-col h-full">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 shadow-lg">
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-white">Arcade Mode</h2>
              <p className="text-[10px] sm:text-xs text-white/50">Hidden Feature Unlocked</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white/70 h-8 w-8 sm:h-9 sm:w-9"
            data-testid="button-close-arcade"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          {currentGame === "menu" && (
            <GameMenu onSelectGame={handleSelectGame} />
          )}
          {currentGame === "snake" && (
            <SnakeGame onBack={() => handleSelectGame("menu")} />
          )}
          {currentGame === "tetris" && (
            <TetrisGame onBack={() => handleSelectGame("menu")} />
          )}
          {currentGame === "runner" && (
            <RunnerGame onBack={() => handleSelectGame("menu")} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ArcadeMobileOverlay({ isOpen, onClose }: ArcadeModeProps) {
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShowCelebration(true);
      sounds.arcadeOpen();
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center md:hidden">
      <div 
        className="absolute inset-0 bg-black"
        onClick={() => {
          sounds.arcadeClose();
          onClose();
        }}
      />
      
      <div className="absolute inset-0 z-10">
        <ArcadeContent onClose={onClose} showCelebration={showCelebration} />
      </div>
    </div>,
    document.body
  );
}

export function ArcadeEmbedded({ isOpen, onClose }: ArcadeModeProps) {
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShowCelebration(true);
      sounds.arcadeOpen();
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-full w-full">
      <ArcadeContent onClose={onClose} showCelebration={showCelebration} embedded />
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
    opacity: 0.4 + Math.random() * 0.6
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
            backgroundColor: `rgba(255,255,255,${p.opacity})`,
            boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,${p.opacity * 0.5})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-celebration-text">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
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
            onMouseEnter={() => sounds.menuHover()}
            className="group p-6 rounded-md border border-white/10 bg-white/5 hover-elevate transition-all duration-300 text-left"
            data-testid={`button-game-${game.id}`}
          >
            <div className="mb-3">
              <game.icon className="w-10 h-10 text-white/80" />
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

  const changeDirection = useCallback((dir: "up" | "down" | "left" | "right") => {
    const { direction } = gameStateRef.current;
    switch (dir) {
      case "up":
        if (direction.y !== 1) gameStateRef.current.nextDirection = { x: 0, y: -1 };
        break;
      case "down":
        if (direction.y !== -1) gameStateRef.current.nextDirection = { x: 0, y: 1 };
        break;
      case "left":
        if (direction.x !== 1) gameStateRef.current.nextDirection = { x: -1, y: 0 };
        break;
      case "right":
        if (direction.x !== -1) gameStateRef.current.nextDirection = { x: 1, y: 0 };
        break;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          changeDirection("up");
          break;
        case "arrowdown":
        case "s":
          changeDirection("down");
          break;
        case "arrowleft":
        case "a":
          changeDirection("left");
          break;
        case "arrowright":
        case "d":
          changeDirection("right");
          break;
        case " ":
          setIsPaused(p => !p);
          break;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        changeDirection(dx > 0 ? "right" : "left");
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        changeDirection(dy > 0 ? "down" : "up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

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
        sounds.gameOver();
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("arcade-snake-highscore", score.toString());
        }
        return;
      }

      state.snake.unshift(newHead);

      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        setScore(s => s + 10);
        sounds.score();
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
        const alpha = 1 - (i / state.snake.length) * 0.5;
        const brightness = 85 - (i / state.snake.length) * 30;
        ctx.fillStyle = `rgba(${brightness * 2.55}, ${brightness * 2.55}, ${brightness * 2.55}, ${alpha})`;
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
          ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
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
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      clearInterval(gameLoop);
    };
  }, [gameOver, isPaused, score, highScore, changeDirection]);

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
        className="rounded-lg border border-white/10 touch-none"
      />
      <TouchControls onDirection={changeDirection} />
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
    { shape: [[1, 1, 1, 1]], color: "rgba(255, 255, 255, 0.9)" },
    { shape: [[1, 1], [1, 1]], color: "rgba(200, 200, 200, 0.9)" },
    { shape: [[1, 1, 1], [0, 1, 0]], color: "rgba(180, 180, 180, 0.9)" },
    { shape: [[1, 1, 1], [1, 0, 0]], color: "rgba(160, 160, 160, 0.9)" },
    { shape: [[1, 1, 1], [0, 0, 1]], color: "rgba(140, 140, 140, 0.9)" },
    { shape: [[1, 1, 0], [0, 1, 1]], color: "rgba(120, 120, 120, 0.9)" },
    { shape: [[0, 1, 1], [1, 1, 0]], color: "rgba(100, 100, 100, 0.9)" },
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

  const rotateShape = useCallback((shape: number[][]) => {
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

  const movePiece = useCallback((dir: "left" | "right" | "down") => {
    if (gameOver) return;
    const state = gameStateRef.current;
    if (!state.currentPiece) return;

    switch (dir) {
      case "left":
        state.currentPiece.x--;
        if (collides(state.currentPiece, state.board)) {
          state.currentPiece.x++;
        }
        break;
      case "right":
        state.currentPiece.x++;
        if (collides(state.currentPiece, state.board)) {
          state.currentPiece.x--;
        }
        break;
      case "down":
        state.currentPiece.y++;
        if (collides(state.currentPiece, state.board)) {
          state.currentPiece.y--;
        }
        break;
    }
  }, [gameOver, collides]);

  const rotatePiece = useCallback(() => {
    if (gameOver) return;
    const state = gameStateRef.current;
    if (!state.currentPiece) return;

    const rotated = rotateShape(state.currentPiece.shape);
    const originalShape = state.currentPiece.shape;
    state.currentPiece.shape = rotated;
    if (collides(state.currentPiece, state.board)) {
      state.currentPiece.shape = originalShape;
    }
  }, [gameOver, rotateShape, collides]);

  const handleDirection = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (dir === "up") {
      rotatePiece();
    } else {
      movePiece(dir);
    }
  }, [movePiece, rotatePiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "arrowleft":
        case "a":
          movePiece("left");
          break;
        case "arrowright":
        case "d":
          movePiece("right");
          break;
        case "arrowdown":
        case "s":
          movePiece("down");
          break;
        case "arrowup":
        case "w":
          rotatePiece();
          break;
        case " ":
          setIsPaused(p => !p);
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
                sounds.lineClear();
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
                sounds.gameOver();
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
  }, [gameOver, isPaused, collides, merge, clearLines, rotateShape, spawnPiece, highScore, movePiece, rotatePiece]);

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
        className="rounded-lg border border-white/10 touch-none"
      />
      <TouchControls onDirection={handleDirection} showRotate onRotate={rotatePiece} />
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
  const animationRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const WIDTH = 600;
  const HEIGHT = 200;
  const GROUND_Y = HEIGHT - 20;
  const PLAYER_HEIGHT = 40;
  const PLAYER_WIDTH = 30;

  const gameStateRef = useRef({
    playerY: GROUND_Y - PLAYER_HEIGHT,
    playerVy: 0,
    isJumping: false,
    obstacles: [] as { x: number; width: number; height: number }[],
    speed: 6,
    nextObstacleIn: 80,
    frameCount: 0,
  });

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      playerY: GROUND_Y - PLAYER_HEIGHT,
      playerVy: 0,
      isJumping: false,
      obstacles: [],
      speed: 6,
      nextObstacleIn: 80,
      frameCount: 0,
    };
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
    sounds.gameStart();
  }, []);

  const handleJump = useCallback(() => {
    if (!isStarted && !gameOver) {
      setIsStarted(true);
      sounds.gameStart();
      return;
    }
    const state = gameStateRef.current;
    if (!state.isJumping && !gameOver && !isPaused) {
      state.playerVy = -14;
      state.isJumping = true;
      sounds.jump();
    }
  }, [isStarted, gameOver, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (!isStarted && !gameOver) {
          setIsStarted(true);
          sounds.gameStart();
          return;
        }
        const state = gameStateRef.current;
        if (!state.isJumping && !gameOver && !isPaused) {
          state.playerVy = -14;
          state.isJumping = true;
          sounds.jump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const gameLoop = () => {
      const state = gameStateRef.current;

      ctx.fillStyle = "rgba(15, 23, 42, 1)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(WIDTH, GROUND_Y);
      ctx.stroke();
      ctx.lineWidth = 1;

      const playerX = 60;

      if (!isStarted) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(playerX, GROUND_Y - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "bold 18px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Press SPACE to start", WIDTH / 2, HEIGHT / 2 - 20);
        ctx.font = "14px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("Jump over obstacles", WIDTH / 2, HEIGHT / 2 + 10);

        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (gameOver || isPaused) {
        ctx.fillStyle = "rgba(120, 120, 120, 0.8)";
        ctx.beginPath();
        ctx.roundRect(playerX, state.playerY, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
        ctx.fill();

        for (const obs of state.obstacles) {
          const obsY = GROUND_Y - obs.height;
          ctx.fillStyle = "rgba(80, 80, 80, 0.8)";
          ctx.beginPath();
          ctx.roundRect(obs.x, obsY, obs.width, obs.height, 4);
          ctx.fill();
        }

        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      state.frameCount++;

      state.playerVy += 0.8;
      state.playerY += state.playerVy;
      
      if (state.playerY >= GROUND_Y - PLAYER_HEIGHT) {
        state.playerY = GROUND_Y - PLAYER_HEIGHT;
        state.playerVy = 0;
        state.isJumping = false;
      }

      state.nextObstacleIn--;
      if (state.nextObstacleIn <= 0) {
        const height = 25 + Math.random() * 25;
        state.obstacles.push({
          x: WIDTH + 10,
          width: 18 + Math.random() * 12,
          height,
        });
        state.nextObstacleIn = 70 + Math.random() * 60;
      }

      state.obstacles = state.obstacles.filter(obs => {
        obs.x -= state.speed;
        return obs.x + obs.width > -10;
      });

      const playerLeft = playerX;
      const playerRight = playerX + PLAYER_WIDTH - 4;
      const playerTop = state.playerY + 4;
      const playerBottom = state.playerY + PLAYER_HEIGHT;

      for (const obs of state.obstacles) {
        const obsY = GROUND_Y - obs.height;
        const obsLeft = obs.x + 2;
        const obsRight = obs.x + obs.width - 2;
        const obsTop = obsY + 2;
        const obsBottom = GROUND_Y;

        if (
          playerRight > obsLeft &&
          playerLeft < obsRight &&
          playerBottom > obsTop &&
          playerTop < obsBottom
        ) {
          setGameOver(true);
          sounds.gameOver();
          const currentScore = scoreRef.current;
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem("arcade-runner-highscore", currentScore.toString());
          }
          animationRef.current = requestAnimationFrame(gameLoop);
          return;
        }
      }

      if (state.frameCount % 6 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      if (state.frameCount % 400 === 0 && state.speed < 12) {
        state.speed += 0.5;
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(playerX, state.playerY, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      for (const obs of state.obstacles) {
        const obsY = GROUND_Y - obs.height;
        ctx.fillStyle = "rgba(150, 150, 150, 0.9)";
        ctx.shadowColor = "rgba(150, 150, 150, 0.4)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(obs.x, obsY, obs.width, obs.height, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isStarted, gameOver, isPaused, highScore]);

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
        className="rounded-lg border border-white/10 touch-none"
        onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
      />
      <JumpButton onJump={handleJump} />
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
            <p className="text-lg font-bold text-white/80">{highScore}</p>
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
              <p className="text-white/70 text-sm mb-4">New High Score!</p>
            )}
            <Button
              onClick={onRestart}
              className="bg-white/20 border border-white/30"
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
