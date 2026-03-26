import { useEffect, useRef, useState, useCallback } from 'react';
import './style.css';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const COLORS = {
  bg: '#e0f8cf',
  dark: '#20002c',
  light: '#ffffff',
  midDark: '#5b0060',
  midLight: '#a800a0'
};

const PIECE_COLORS: Record<string, string> = {
  'I': '#00f0f0',
  'O': '#f0f000',
  'T': '#a000f0',
  'S': '#00f000',
  'Z': '#f00000',
  'J': '#0000f0',
  'L': '#f0a000'
};

const TETROMINOS: Record<string, number[][]> = {
  'I': [[1, 1, 1, 1]],
  'O': [[1, 1], [1, 1]],
  'T': [[0, 1, 0], [1, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]],
  'J': [[1, 0, 0], [1, 1, 1]],
  'L': [[0, 0, 1], [1, 1, 1]]
};

const translations = {
  EN: {
    paused: "PAUSED", resume: "RESUME", sound: "SOUND", lang: "LANGUAGE",
    esc: "Press Backspace to Resume", score: "SCORE", level: "LEVEL", lines: "LINES",
    next: "NEXT", start: "Press ENTER to Start", gameOver: "GAME OVER", mainMenu: "Backspace for Main Menu",
    move: "← → Move", rotate: "↑ Rotate", drop: "↓ Soft Drop", hardDrop: "SPACE Hard Drop",
    pauseResume: "Backspace Pause/Resume", ccredits: "C For Credits", language: "L for Language", credits: "CREDITS",
    developedBy: "Game developed by Adriano Pimentel.", specialThanks: "Special thanks to:",
    thanks1: "Vando Griffitt(Happy birthday 2026!)", thanks2: "Alex Griffitt", thanks3: "Gabriel Pimentel",
    creditsReturn: "Backspace to Return"
  },
  PT: {
    paused: "PAUSADO", resume: "CONTINUAR", sound: "SOM", lang: "IDIOMA",
    esc: "Pressione Backspace para Voltar", score: "PONTOS", level: "NÍVEL", lines: "LINHAS",
    next: "PRÓXIMO", start: "Aperte ENTER para Iniciar", gameOver: "FIM DE JOGO", mainMenu: "Backspace para Menu Principal",
    move: "← → Mover", rotate: "↑ Rotacionar", drop: "↓ Queda Suave", hardDrop: "SPACE Queda Rápida",
    pauseResume: "Backspace Pausar/Continuar", ccredits: "C Para Créditos", language: "L para idioma", credits: "CRÉDITOS",
    developedBy: "Jogo desenvolvido por Adriano Pimentel.", specialThanks: "Agradecimentos especiais a:",
    thanks1: "Vando Griffitt(Feliz aniversário 2026!)", thanks2: "Alex Griffitt", thanks3: "Gabriel Pimentel",
    creditsReturn: "Backspace para Voltar"
  }
};

const NOTES: Record<string, number> = {
  'E5': 659.25, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'A4': 440.00,
  'G4': 392.00, 'F4': 349.23, 'E4': 329.63, 'G#4': 415.30, 'B5': 987.77
};

const TETRIS_THEME = [
  { note: 'E5', duration: 400 }, { note: 'B4', duration: 200 }, { note: 'C5', duration: 200 }, { note: 'D5', duration: 400 },
  { note: 'C5', duration: 200 }, { note: 'B4', duration: 200 }, { note: 'A4', duration: 400 }, { note: 'A4', duration: 200 },
  { note: 'C5', duration: 200 }, { note: 'E5', duration: 400 }, { note: 'D5', duration: 200 }, { note: 'C5', duration: 200 },
  { note: 'B4', duration: 400 }, { note: 'B4', duration: 200 }, { note: 'C5', duration: 200 }, { note: 'D5', duration: 400 },
  { note: 'E5', duration: 400 }, { note: 'C5', duration: 400 }, { note: 'A4', duration: 400 }, { note: 'A4', duration: 400 },
  { note: 'D5', duration: 600 }, { note: 'F4', duration: 200 }, { note: 'A4', duration: 200 }, { note: 'D5', duration: 400 },
  { note: 'C5', duration: 200 }, { note: 'B4', duration: 200 }, { note: 'E5', duration: 600 }, { note: 'C5', duration: 200 },
  { note: 'E5', duration: 400 }, { note: 'D5', duration: 200 }, { note: 'C5', duration: 200 }, { note: 'B4', duration: 400 },
  { note: 'B4', duration: 200 }, { note: 'C5', duration: 200 }, { note: 'D5', duration: 400 }, { note: 'E5', duration: 400 },
  { note: 'C5', duration: 400 }, { note: 'A4', duration: 400 }, { note: 'A4', duration: 400 },
];

type Piece = {
  shape: number[][];
  type: string;
};

interface GameState {
  grid: number[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  x: number;
  y: number;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  dropCounter: number;
  dropInterval: number;
  lastTime: number;
  gameStarted: boolean;
  soundEnabled: boolean;
  language: 'EN' | 'PT';
  menuIndex: number;
  currentNoteIndex: number;
  nextNoteTime: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(0);
  const keysRef = useRef({
    left: false,
    right: false,
    down: false,
    up: false,
    space: false
  });
  const lastKeyPressRef = useRef({
    left: 0,
    right: 0,
    down: 0
  });

  const [gameState, setGameState] = useState<GameState>({
    grid: createGrid(),
    currentPiece: null,
    nextPiece: null,
    x: 0,
    y: 0,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
    dropCounter: 0,
    dropInterval: 1000,
    lastTime: 0,
    gameStarted: false,
    soundEnabled: true,
    language: 'EN',
    menuIndex: 0,
    currentNoteIndex: 0,
    nextNoteTime: 0,
  });

  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showGameOverScreen, setShowGameOverScreen] = useState(false);
  const [showPauseScreen, setShowPauseScreen] = useState(false);
  const [showCreditsScreen, setShowCreditsScreen] = useState(false);

  function createGrid(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece(): Piece {
    const pieces = Object.keys(TETROMINOS);
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      shape: TETROMINOS[piece],
      type: piece
    };
  }

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!gameState.soundEnabled || !audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, [gameState.soundEnabled]);

  const playSoundMove = useCallback(() => playSound(150, 0.05), [playSound]);
  const playSoundRotate = useCallback(() => playSound(200, 0.05), [playSound]);
  const playSoundDrop = useCallback(() => playSound(100, 0.1), [playSound]);
  const playSoundLineClear = useCallback(() => {
    playSound(400, 0.2);
    setTimeout(() => playSound(500, 0.2), 100);
  }, [playSound]);
  const playSoundGameOver = useCallback(() => {
    playSound(200, 0.3);
    setTimeout(() => playSound(150, 0.3), 150);
    setTimeout(() => playSound(100, 0.5), 300);
  }, [playSound]);

  function collision(grid: number[][], shape: number[][], offsetX: number, offsetY: number): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = x + offsetX;
          const newY = y + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }

          if (newY >= 0 && grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function merge(grid: number[][], shape: number[][], offsetX: number, offsetY: number, type: string) {
    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = y + offsetY;
          const newX = x + offsetX;
          if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            grid[newY][newX] = type as any;
          }
        }
      });
    });
  }

  function rotate(shape: number[][]): number[][] {
    return shape[0].map((_, i) =>
      shape.map(row => row[i]).reverse()
    );
  }

  const drawBlock = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    ctx.strokeStyle = COLORS.midDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    ctx.fillStyle = COLORS.midLight;
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
  }, []);

  const draw = useCallback((state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawBlock(ctx, x, y, PIECE_COLORS[cell]);
        }
      });
    });

    if (state.currentPiece) {
      state.currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            drawBlock(ctx, x + state.x, y + state.y, PIECE_COLORS[state.currentPiece!.type]);
          }
        });
      });

      let ghostY = state.y;
      while (!collision(state.grid, state.currentPiece.shape, state.x, ghostY + 1)) {
        ghostY++;
      }

      if (ghostY !== state.y) {
        ctx.globalAlpha = 0.3;
        state.currentPiece.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value) {
              drawBlock(ctx, x + state.x, y + ghostY, PIECE_COLORS[state.currentPiece!.type]);
            }
          });
        });
        ctx.globalAlpha = 1.0;
      }
    }
  }, [drawBlock]);

  const drawNextPiece = useCallback((state: GameState) => {
    const nextCanvas = nextCanvasRef.current;
    if (!nextCanvas) return;
    const nextCtx = nextCanvas.getContext('2d');
    if (!nextCtx) return;

    nextCtx.fillStyle = COLORS.bg;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (state.nextPiece) {
      const shape = state.nextPiece.shape;
      const blockSize = 20;
      const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
      const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const drawX = offsetX + x * blockSize;
            const drawY = offsetY + y * blockSize;

            nextCtx.fillStyle = PIECE_COLORS[state.nextPiece!.type];
            nextCtx.fillRect(drawX, drawY, blockSize, blockSize);

            nextCtx.strokeStyle = COLORS.midDark;
            nextCtx.lineWidth = 1;
            nextCtx.strokeRect(drawX, drawY, blockSize, blockSize);
          }
        });
      });
    }
  }, []);

  const clearLines = useCallback((state: GameState): GameState => {
    let linesCleared = 0;
    const newGrid = [...state.grid];

    for (let y = ROWS - 1; y >= 0; y--) {
      if (newGrid[y].every(cell => cell !== 0)) {
        newGrid.splice(y, 1);
        newGrid.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }

    if (linesCleared > 0) {
      playSoundLineClear();
      const points = [0, 40, 100, 300, 1200];
      const newScore = state.score + points[linesCleared] * state.level;
      const newLines = state.lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newDropInterval = Math.max(100, 1000 - (newLevel - 1) * 50);

      return {
        ...state,
        grid: newGrid,
        score: newScore,
        lines: newLines,
        level: newLevel,
        dropInterval: newDropInterval
      };
    }

    return { ...state, grid: newGrid };
  }, [playSoundLineClear]);

  const spawnPiece = useCallback((state: GameState): GameState => {
    let newNextPiece = state.nextPiece;
    if (!newNextPiece) {
      newNextPiece = randomPiece();
    }

    const currentPiece = newNextPiece;
    newNextPiece = randomPiece();
    const x = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
    const y = 0;

    if (collision(state.grid, currentPiece.shape, x, y)) {
      playSoundGameOver();
      setShowGameOverScreen(true);
      return {
        ...state,
        gameOver: true,
        currentPiece,
        nextPiece: newNextPiece,
        x,
        y
      };
    }

    return {
      ...state,
      currentPiece,
      nextPiece: newNextPiece,
      x,
      y
    };
  }, [playSoundGameOver]);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    const canvas = canvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    if (canvas && nextCanvas) {
      const ctx = canvas.getContext('2d');
      const nextCtx = nextCanvas.getContext('2d');
      if (ctx && nextCtx) {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        nextCtx.fillStyle = COLORS.bg;
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    draw(gameState);
    drawNextPiece(gameState);
  }, [gameState, draw, drawNextPiece]);

  const playMusicStep = useCallback((time: number, state: GameState): GameState => {
    if (!state.soundEnabled || !state.gameStarted || state.paused || state.gameOver || !audioContextRef.current) {
      return state;
    }

    if (time > state.nextNoteTime) {
      const noteData = TETRIS_THEME[state.currentNoteIndex];
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(NOTES[noteData.note], audioContextRef.current.currentTime);

      const vol = 0.02;
      gain.gain.setValueAtTime(vol, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + (noteData.duration / 1000) * 0.9);

      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);

      osc.start();
      osc.stop(audioContextRef.current.currentTime + noteData.duration / 1000);

      const speedFactor = Math.max(0.6, 1 - (state.level - 1) * 0.05);
      const nextNoteTime = time + (noteData.duration * speedFactor);
      const currentNoteIndex = (state.currentNoteIndex + 1) % TETRIS_THEME.length;

      return {
        ...state,
        nextNoteTime,
        currentNoteIndex
      };
    }

    return state;
  }, []);

  const update = useCallback((time: number = 0) => {
    setGameState(prevState => {
      if (prevState.gameOver || !prevState.gameStarted || prevState.paused) {
        return prevState;
      }

      let newState = playMusicStep(time, prevState);

      const deltaTime = time - newState.lastTime;
      newState = {
        ...newState,
        lastTime: time,
        dropCounter: newState.dropCounter + deltaTime
      };

      if (newState.dropCounter > newState.dropInterval) {
        newState = {
          ...newState,
          y: newState.y + 1,
          dropCounter: 0
        };

        if (newState.currentPiece && collision(newState.grid, newState.currentPiece.shape, newState.x, newState.y)) {
          newState.y--;
          merge(newState.grid, newState.currentPiece.shape, newState.x, newState.y, newState.currentPiece.type);
          playSoundDrop();
          newState = clearLines(newState);
          newState = spawnPiece(newState);
        }
      }

      const now = Date.now();
      const keys = keysRef.current;
      const lastKeyPress = lastKeyPressRef.current;

      if (keys.left && now - lastKeyPress.left > 150 && newState.currentPiece) {
        const newX = newState.x - 1;
        if (!collision(newState.grid, newState.currentPiece.shape, newX, newState.y)) {
          newState = { ...newState, x: newX };
          playSoundMove();
        }
        lastKeyPress.left = now;
      }

      if (keys.right && now - lastKeyPress.right > 150 && newState.currentPiece) {
        const newX = newState.x + 1;
        if (!collision(newState.grid, newState.currentPiece.shape, newX, newState.y)) {
          newState = { ...newState, x: newX };
          playSoundMove();
        }
        lastKeyPress.right = now;
      }

      if (keys.down && now - lastKeyPress.down > 50 && newState.currentPiece) {
        newState = {
          ...newState,
          y: newState.y + 1,
          score: newState.score + 1
        };

        if (collision(newState.grid, newState.currentPiece.shape, newState.x, newState.y)) {
          newState.y--;
          merge(newState.grid, newState.currentPiece.shape, newState.x, newState.y, newState.currentPiece.type);
          playSoundDrop();
          newState = clearLines(newState);
          newState = spawnPiece(newState);
        }
        lastKeyPress.down = now;
      }

      return newState;
    });

    animationFrameRef.current = requestAnimationFrame(update);
  }, [playMusicStep, playSoundDrop, playSoundMove, clearLines, spawnPiece]);

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && !gameState.paused) {
      animationFrameRef.current = requestAnimationFrame(update);
      return () => {
        cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [gameState.gameStarted, gameState.gameOver, gameState.paused, update]);

  const startGame = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const newState: GameState = {
      grid: createGrid(),
      currentPiece: null,
      nextPiece: null,
      x: 0,
      y: 0,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
      dropCounter: 0,
      dropInterval: 1000,
      lastTime: 0,
      gameStarted: true,
      soundEnabled: gameState.soundEnabled,
      language: gameState.language,
      menuIndex: 0,
      currentNoteIndex: 0,
      nextNoteTime: 0,
    };

    setGameState(spawnPiece(newState));
    setShowStartScreen(false);
    setShowGameOverScreen(false);
    setShowPauseScreen(false);
    setShowCreditsScreen(false);
  }, [gameState.soundEnabled, gameState.language, spawnPiece]);

  const togglePause = useCallback(() => {
    setGameState(prev => {
      const newPaused = !prev.paused;
      if (newPaused) {
        setShowPauseScreen(true);
        return { ...prev, paused: true, menuIndex: 0 };
      } else {
        setShowPauseScreen(false);
        return { ...prev, paused: false, lastTime: 0 };
      }
    });
  }, []);

  const executeMenuOption = useCallback(() => {
    switch (gameState.menuIndex) {
      case 0:
        togglePause();
        break;
      case 1:
        setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
        break;
      case 2:
        setGameState(prev => ({ ...prev, language: prev.language === 'EN' ? 'PT' : 'EN' }));
        break;
    }
  }, [gameState.menuIndex, togglePause]);

  const resetToInitialScreen = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      grid: createGrid(),
      gameStarted: false,
      gameOver: false,
      paused: false
    }));
    setShowStartScreen(true);
    setShowGameOverScreen(false);
    setShowPauseScreen(false);
    setShowCreditsScreen(false);
  }, []);

  const showCredits = useCallback(() => {
    setShowStartScreen(false);
    setShowGameOverScreen(false);
    setShowPauseScreen(false);
    setShowCreditsScreen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (showCreditsScreen) {
          setShowCreditsScreen(false);
          setShowStartScreen(true);
        } else if (gameState.gameStarted && !gameState.gameOver) {
          togglePause();
        } else if (gameState.gameOver) {
          resetToInitialScreen();
        }
        return;
      }

      if (showCreditsScreen) return;

      if (!gameState.gameStarted || gameState.gameOver) {
        if (e.key === 'Enter') {
          e.preventDefault();
          startGame();
        } else if (e.key.toLowerCase() === 'c' && !gameState.gameOver) {
          showCredits();
        } else if (e.key.toLowerCase() === 'l' && !gameState.gameOver) {
          setGameState(prev => ({ ...prev, language: prev.language === 'EN' ? 'PT' : 'EN' }));
        }
        return;
      }

      if (gameState.paused) {
        switch (e.key) {
          case 'ArrowUp':
            setGameState(prev => ({ ...prev, menuIndex: (prev.menuIndex - 1 + 3) % 3 }));
            break;
          case 'ArrowDown':
            setGameState(prev => ({ ...prev, menuIndex: (prev.menuIndex + 1) % 3 }));
            break;
          case 'Enter':
            executeMenuOption();
            break;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (!keysRef.current.left) {
            keysRef.current.left = true;
            setGameState(prev => {
              if (!prev.currentPiece) return prev;
              const newX = prev.x - 1;
              if (!collision(prev.grid, prev.currentPiece.shape, newX, prev.y)) {
                playSoundMove();
                return { ...prev, x: newX };
              }
              return prev;
            });
            lastKeyPressRef.current.left = Date.now();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!keysRef.current.right) {
            keysRef.current.right = true;
            setGameState(prev => {
              if (!prev.currentPiece) return prev;
              const newX = prev.x + 1;
              if (!collision(prev.grid, prev.currentPiece.shape, newX, prev.y)) {
                playSoundMove();
                return { ...prev, x: newX };
              }
              return prev;
            });
            lastKeyPressRef.current.right = Date.now();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!keysRef.current.down) {
            keysRef.current.down = true;
            setGameState(prev => {
              if (!prev.currentPiece) return prev;
              let newState = { ...prev, y: prev.y + 1, score: prev.score + 1 };

              if (collision(newState.grid, newState.currentPiece.shape, newState.x, newState.y)) {
                newState.y--;
                merge(newState.grid, newState.currentPiece.shape, newState.x, newState.y, newState.currentPiece.type);
                playSoundDrop();
                newState = clearLines(newState);
                newState = spawnPiece(newState);
              }
              return newState;
            });
            lastKeyPressRef.current.down = Date.now();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setGameState(prev => {
            if (!prev.currentPiece) return prev;
            const rotated = rotate(prev.currentPiece.shape);
            if (!collision(prev.grid, rotated, prev.x, prev.y)) {
              playSoundRotate();
              return {
                ...prev,
                currentPiece: { ...prev.currentPiece, shape: rotated }
              };
            }
            return prev;
          });
          break;
        case ' ':
          e.preventDefault();
          if (!keysRef.current.space) {
            keysRef.current.space = true;
            setGameState(prev => {
              if (!prev.currentPiece) return prev;
              const gridCopy = prev.grid.map(row => [...row]);

              let newY = prev.y;
              let newScore = prev.score;

              while (!collision(gridCopy, prev.currentPiece.shape, prev.x, newY + 1)) {
                newY++;
                newScore += 2;
              }

              merge(gridCopy, prev.currentPiece.shape, prev.x, newY, prev.currentPiece.type);
              playSoundDrop();
              let newState = { ...prev, grid: gridCopy, y: newY, score: newScore };
              newState = clearLines(newState);
              newState = spawnPiece(newState);
              return newState;
            });
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          keysRef.current.left = false;
          break;
        case 'ArrowRight':
          keysRef.current.right = false;
          break;
        case 'ArrowDown':
          keysRef.current.down = false;
          break;
        case ' ':
          keysRef.current.space = false;
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, showCreditsScreen, startGame, togglePause, executeMenuOption, resetToInitialScreen, showCredits, playSoundMove, playSoundRotate, playSoundDrop, clearLines, spawnPiece]);

  const lang = gameState.language;

  return (
    <div className="container">
      <div className="game-wrapper">
        <div className="screen-border">
          <div className="game-screen">
            <canvas ref={canvasRef} id="tetris" width="300" height="600"></canvas>
            <div className={`overlay ${!showStartScreen && !showGameOverScreen && !showPauseScreen && !showCreditsScreen ? 'hidden' : ''}`}>
              <div className={`screen ${!showStartScreen ? 'hidden' : ''}`}>
                <h1>Vando's TETRIS</h1>
                <p>{translations[lang].start}</p>
                <div className="controls">
                  <p>{translations[lang].move}</p>
                  <p>{translations[lang].rotate}</p>
                  <p>{translations[lang].drop}</p>
                  <p>{translations[lang].hardDrop}</p>
                  <p>{translations[lang].pauseResume}</p>
                  <p>{translations[lang].ccredits}</p>
                  <p>{translations[lang].language}</p>
                </div>
              </div>
              <div className={`screen ${!showGameOverScreen ? 'hidden' : ''}`}>
                <h1>{translations[lang].gameOver}</h1>
                <p>Final Score: {gameState.score}</p>
                <p>{translations[lang].start}</p>
                <p>{translations[lang].mainMenu}</p>
              </div>
              <div className={`screen ${!showPauseScreen ? 'hidden' : ''}`}>
                <h1>{translations[lang].paused}</h1>
                <div className="menu-container">
                  <div className={`menu-item ${gameState.menuIndex === 0 ? 'selected' : ''}`}>
                    {translations[lang].resume}
                  </div>
                  <div className={`menu-item ${gameState.menuIndex === 1 ? 'selected' : ''}`}>
                    {translations[lang].sound}: {gameState.soundEnabled ? 'ON' : 'OFF'}
                  </div>
                  <div className={`menu-item ${gameState.menuIndex === 2 ? 'selected' : ''}`}>
                    {translations[lang].lang}: {lang}
                  </div>
                </div>
                <p>{translations[lang].esc}</p>
              </div>
              <div className={`screen ${!showCreditsScreen ? 'hidden' : ''}`}>
                <h1>{translations[lang].credits}</h1>
                <div className="controls">
                  <h2>{translations[lang].developedBy}</h2>
                  <br />
                  <h3>{translations[lang].specialThanks}</h3>
                  <p>{translations[lang].thanks1}</p>
                  <p>{translations[lang].thanks2}</p>
                  <p>{translations[lang].thanks3}</p>
                  <br />
                  <p>{translations[lang].creditsReturn}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="info-panel">
          <div className="info-box">
            <div className="label">{translations[lang].score}</div>
            <div className="value">{gameState.score}</div>
          </div>
          <div className="info-box">
            <div className="label">{translations[lang].level}</div>
            <div className="value">{gameState.level}</div>
          </div>
          <div className="info-box">
            <div className="label">{translations[lang].lines}</div>
            <div className="value">{gameState.lines}</div>
          </div>
          <div className="info-box next-piece-box">
            <div className="label">{translations[lang].next}</div>
            <canvas ref={nextCanvasRef} id="nextPiece" width="120" height="80"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
