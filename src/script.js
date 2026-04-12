const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');

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

const PIECE_COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000'
};

const TETROMINOS = {
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'Z': [[1, 1, 0], [0, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]]
};

let gameState = {
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
    musicEnabled: true,
    currentNoteIndex: 0,
    nextNoteTime: 0,
    showingCredits: false
};

let keys = {
    left: false,
    right: false,
    down: false,
    up: false,
    space: false
};

let keyRepeatDelay = 150;
let lastKeyPress = {
    left: 0,
    right: 0,
    down: 0
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

const NOTES = {
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

function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        shape: TETROMINOS[piece],
        type: piece
    };
}

function playSound(frequency, duration, type = 'square') {
    if (!gameState.soundEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playSoundMove() {
    playSound(150, 0.05);
}

function playSoundRotate() {
    playSound(200, 0.05);
}

function playSoundDrop() {
    playSound(100, 0.1);
}

function playSoundLineClear() {
    playSound(400, 0.2);
    setTimeout(() => playSound(500, 0.2), 100);
}

function playSoundGameOver() {
    playSound(200, 0.3);
    setTimeout(() => playSound(150, 0.3), 150);
    setTimeout(() => playSound(100, 0.5), 300);
}

function spawnPiece() {
    if (!gameState.nextPiece) {
        gameState.nextPiece = randomPiece();
    }

    gameState.currentPiece = gameState.nextPiece;
    gameState.nextPiece = randomPiece();
    gameState.x = Math.floor(COLS / 2) - Math.floor(gameState.currentPiece.shape[0].length / 2);
    gameState.y = 0;

    if (collision(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y)) {
        gameState.gameOver = true;
        playSoundGameOver();
        showGameOver();
    }

    drawNextPiece();
}

function collision(grid, shape, offsetX, offsetY) {
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

function merge(grid, shape, offsetX, offsetY, type) {
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const newY = y + offsetY;
                const newX = x + offsetX;
                if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
                    grid[newY][newX] = type;
                }
            }
        });
    });
}

function rotate(shape) {
    const newShape = shape[0].map((_, i) =>
        shape.map(row => row[i]).reverse()
    );
    return newShape;
}

function clearLines() {
    let linesCleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        if (gameState.grid[y].every(cell => cell !== 0)) {
            gameState.grid.splice(y, 1);
            gameState.grid.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        playSoundLineClear();
        gameState.lines += linesCleared;

        const points = [0, 40, 100, 300, 1200];
        gameState.score += points[linesCleared] * gameState.level;

        gameState.level = Math.floor(gameState.lines / 10) + 1;
        gameState.dropInterval = Math.max(100, 1000 - (gameState.level - 1) * 50);

        updateDisplay();
    }
}

function drop() {
    gameState.y++;
    if (collision(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y)) {
        gameState.y--;
        merge(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y, gameState.currentPiece.type);
        playSoundDrop();
        clearLines();
        spawnPiece();
    }
    gameState.dropCounter = 0;
}

function hardDrop() {
    while (!collision(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y + 1)) {
        gameState.y++;
        gameState.score += 2;
    }
    merge(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y, gameState.currentPiece.type);
    playSoundDrop();
    clearLines();
    spawnPiece();
    updateDisplay();
}

function moveLeft() {
    gameState.x--;
    if (collision(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y)) {
        gameState.x++;
    } else {
        playSoundMove();
    }
}

function moveRight() {
    gameState.x++;
    if (collision(gameState.grid, gameState.currentPiece.shape, gameState.x, gameState.y)) {
        gameState.x--;
    } else {
        playSoundMove();
    }
}

function rotatePiece() {
    const rotated = rotate(gameState.currentPiece.shape);
    if (!collision(gameState.grid, rotated, gameState.x, gameState.y)) {
        gameState.currentPiece.shape = rotated;
        playSoundRotate();
    }
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    ctx.strokeStyle = COLORS.midDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    ctx.fillStyle = COLORS.midLight;
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gameState.grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                drawBlock(ctx, x, y, PIECE_COLORS[cell]);
            }
        });
    });

    if (gameState.currentPiece) {
        gameState.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(ctx, x + gameState.x, y + gameState.y, PIECE_COLORS[gameState.currentPiece.type]);
                }
            });
        });

        let ghostY = gameState.y;
        while (!collision(gameState.grid, gameState.currentPiece.shape, gameState.x, ghostY + 1)) {
            ghostY++;
        }

        if (ghostY !== gameState.y) {
            ctx.globalAlpha = 0.3;
            gameState.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        drawBlock(ctx, x + gameState.x, y + ghostY, PIECE_COLORS[gameState.currentPiece.type]);
                    }
                });
            });
            ctx.globalAlpha = 1.0;
        }
    }
}

function drawNextPiece() {
    nextCtx.fillStyle = COLORS.bg;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (gameState.nextPiece) {
        const shape = gameState.nextPiece.shape;
        const blockSize = 20;
        const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = offsetX + x * blockSize;
                    const drawY = offsetY + y * blockSize;

                    nextCtx.fillStyle = PIECE_COLORS[gameState.nextPiece.type];
                    nextCtx.fillRect(drawX, drawY, blockSize, blockSize);

                    nextCtx.strokeStyle = COLORS.midDark;
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(drawX, drawY, blockSize, blockSize);
                }
            });
        });
    }
}

function updateDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lines').textContent = gameState.lines;
}

function handleInput() {
    const now = Date.now();

    if (keys.left && now - lastKeyPress.left > keyRepeatDelay) {
        moveLeft();
        lastKeyPress.left = now;
    }

    if (keys.right && now - lastKeyPress.right > keyRepeatDelay) {
        moveRight();
        lastKeyPress.right = now;
    }

    if (keys.down && now - lastKeyPress.down > 50) {
        drop();
        gameState.score += 1;
        updateDisplay();
        lastKeyPress.down = now;
    }
}

function update(time = 0) {
    if (gameState.gameOver || !gameState.gameStarted || gameState.paused) {
        return;
    }

    playMusicStep(time);

    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;
    gameState.dropCounter += deltaTime;

    if (gameState.dropCounter > gameState.dropInterval) {
        drop();
    }

    handleInput();
    draw();
    requestAnimationFrame(update);
}

function startGame() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const currentSound = gameState.soundEnabled;
    const currentLang = gameState.language;

    gameState = {
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
        soundEnabled: currentSound,
        language: currentLang,
        menuIndex: 0,
        musicEnabled: currentSound,
        currentNoteIndex: 0,
        nextNoteTime: 0,
    };

    updateMainLabels();
    updateDisplay();
    hideAllScreens();
    spawnPiece();
    requestAnimationFrame(update);
}

function showGameOver() {
    document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
}

function hideStartScreen() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}

function showStartScreen() {
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    updateMainLabels();
}

function showPauseScreen() {
    const pauseScreen = document.getElementById('pauseScreen');
    pauseScreen.classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
}

function hidePauseScreen() {
    const pauseScreen = document.getElementById('pauseScreen');
    pauseScreen.classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
}

function togglePause() {
    if (!gameState.gameStarted || gameState.gameOver) return;

    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        gameState.menuIndex = 0;
        showPauseScreen();
        updateMenuUI();
    } else {
        hidePauseScreen();
        gameState.lastTime = performance.now();
        requestAnimationFrame(update);
    }
}

function hideAllScreens() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('creditsScreen').classList.add('hidden');
    gameState.showingCredits = false;
}

function updateMenuUI() {
    const items = document.querySelectorAll('.menu-item');
    items.forEach((item, idx) => {
        item.classList.toggle('selected', idx === gameState.menuIndex);
    });

    const lang = gameState.language;
    document.getElementById('opt-resume').textContent = translations[lang].resume;
    document.getElementById('opt-sound').textContent = `${translations[lang].sound}: ${gameState.soundEnabled ? 'ON' : 'OFF'}`;
    document.getElementById('opt-lang').textContent = `${translations[lang].lang}: ${lang}`;
    
    document.getElementById('txt-paused').textContent = translations[lang].paused;
    document.getElementById('txt-esc-resume').textContent = translations[lang].esc;
}

function updateMainLabels(isShowingCredits = false) {
    const lang = gameState.language;
    const labels = document.querySelectorAll('.info-box .label');
    
    labels[0].textContent = translations[lang].score;
    labels[1].textContent = translations[lang].level;
    labels[2].textContent = translations[lang].lines;
    labels[3].textContent = translations[lang].next;

    document.querySelector('#startScreen h1').nextElementSibling.textContent = translations[lang].start;
    document.getElementById('move').textContent = translations[lang].move;
    document.getElementById('rotate').textContent = translations[lang].rotate;    
    document.getElementById('drop').textContent = translations[lang].drop;
    document.getElementById('hardDrop').textContent = translations[lang].hardDrop;
    document.getElementById('pauseResume').textContent = translations[lang].pauseResume;
    document.getElementById('ccredits').textContent = translations[lang].ccredits;
    document.getElementById('language').textContent = translations[lang].language;
    
    document.querySelector('#gameOverScreen h1').textContent = translations[lang].gameOver;
    document.getElementById('gamerestart').textContent = translations[lang].start;
    document.getElementById('gametitle').textContent = translations[lang].mainMenu;

    document.querySelector('#creditsScreen h1').textContent = translations[lang].credits;
    document.querySelector('#creditsScreen h2').textContent = translations[lang].developedBy;
    document.querySelector('#creditsScreen h3').textContent = translations[lang].specialThanks;
    document.getElementById('thanks1').textContent = translations[lang].thanks1;
    document.getElementById('thanks2').textContent = translations[lang].thanks2;
    document.getElementById('thanks3').textContent = translations[lang].thanks3;
    document.getElementById('creditsReturn').textContent = translations[lang].creditsReturn;

    const btnBack = document.getElementById('touch-back');
    const btnHard = document.getElementById('touch-hard');
    const btnStart = document.getElementById('touch-pause');

    if (btnBack && btnHard) {
        if (gameState.showingCredits) {
            btnBack.textContent = 'Back'; 
            btnHard.textContent = '';
            btnStart.textContent = '';
        } else if (!gameState.gameStarted && !gameState.gameOver) {
            btnBack.textContent = translations[lang].credits;
            btnHard.textContent = translations[lang].lang;
            btnStart.textContent = 'START';
        } else {
            btnBack.textContent = 'BACK';
            btnHard.textContent = 'HARD';
        }
    }
}

function executeMenuOption() {
    switch(gameState.menuIndex) {
        case 0:
            togglePause();
            break;
        case 1:
            gameState.soundEnabled = !gameState.soundEnabled;
            updateMenuUI();
            break;
        case 2:
            gameState.language = gameState.language === 'EN' ? 'PT' : 'EN';
            updateMenuUI();
            updateMainLabels();
            break;
    }
}

function playMusicStep(time) {
    if (!gameState.soundEnabled || !gameState.gameStarted || gameState.paused || gameState.gameOver) return;

    if (time > gameState.nextNoteTime) {
        const noteData = TETRIS_THEME[gameState.currentNoteIndex];
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(NOTES[noteData.note], audioContext.currentTime);
        
        const vol = 0.02; 
        gain.gain.setValueAtTime(vol, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + (noteData.duration / 1000) * 0.9);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + noteData.duration / 1000);

        const speedFactor = Math.max(0.6, 1 - (gameState.level - 1) * 0.05);
        gameState.nextNoteTime = time + (noteData.duration * speedFactor);


        gameState.currentNoteIndex = (gameState.currentNoteIndex + 1) % TETRIS_THEME.length;
    }
}

function showCredits() {
    hideAllScreens();
    gameState.showingCredits = true;
    document.getElementById('creditsScreen').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    updateMainLabels();
}

function hideCredits() {
    gameState.showingCredits = false;
    document.getElementById('creditsScreen').classList.add('hidden');
    showStartScreen();
    updateMainLabels();
}

function resetToInitialScreen() {
    resetGameContext();
    hideAllScreens();
    showStartScreen();
    updateMainLabels();
}

function setupTouchControls() {
    const mapTouch = (id, action) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();

            if (gameState.showingCredits) {
                if (id === 'touch-back') {
                    hideCredits();
                }
                return;
            }

            if (!gameState.gameStarted && !gameState.gameOver) {
                if (id === 'touch-back') {
                    showCredits();
                    return;
                }
                if (id === 'touch-hard') {
                    gameState.language = gameState.language === 'EN' ? 'PT' : 'EN';
                    updateMainLabels();
                    return;
                }
                if (id === 'touch-pause') {
                    startGame();
                    return;
                }
                return;
            }

            if (gameState.paused) {
                if (id === 'touch-up') {
                    gameState.menuIndex = (gameState.menuIndex - 1 + 3) % 3;
                    updateMenuUI();
                } else if (id === 'touch-down') {
                    gameState.menuIndex = (gameState.menuIndex + 1) % 3;
                    updateMenuUI();
                } else if (id === 'touch-pause' || id === 'touch-hard' || id === 'touch-back') {
                    executeMenuOption();
                }
                return;
            }

            if (gameState.gameOver) {
                if (id === 'touch-pause') {
                    startGame();
                } else if (id === 'touch-back') {
                    resetToInitialScreen();
                }
                return;
            }

            if (gameState.gameStarted && !gameState.gameOver) {
                if (id === 'touch-pause') {
                    togglePause();
                } else if (id === 'touch-back') {
                    togglePause();
                } else {
                    action();
                }
            }
        }, { passive: false });
    };

    mapTouch('touch-left', moveLeft);
    mapTouch('touch-right', moveRight);
    mapTouch('touch-up', rotatePiece);
    mapTouch('touch-down', () => { 
        if (!gameState.paused) {
            drop(); 
            gameState.score += 1; 
            updateDisplay(); 
        }
    });
    mapTouch('touch-hard', hardDrop);
    mapTouch('touch-pause', togglePause);
    mapTouch('touch-back', null); 
}

function resetGameContext() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.lines = 0;
    gameState.gameStarted = false;
    gameState.gameOver = false;
    gameState.paused = false;

    updateDisplay();
    
    nextCtx.fillStyle = COLORS.bg;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
}

document.addEventListener('keydown', (e) => {
    const creditsScreen = document.getElementById('creditsScreen');
    const isCreditsOpen = creditsScreen && !creditsScreen.classList.contains('hidden');

    if (e.key === 'Backspace') {
        e.preventDefault();
        if (isCreditsOpen) {
            hideAllScreens();
            showStartScreen();
        } else if (gameState.gameStarted && !gameState.gameOver) {
            togglePause();
        } else if (gameState.gameOver) {
            resetToInitialScreen();
        }
        return;
    }

    if (isCreditsOpen) return;

    if (!gameState.gameStarted || gameState.gameOver) {
        if (e.key === 'Enter') {
            e.preventDefault();
            startGame();
        }
        else if (e.key.toLowerCase() === 'c' && !gameState.gameOver) {
            showCredits();
        }
        else if (e.key.toLowerCase() === 'l' && !gameState.gameOver) {
            gameState.language = gameState.language === 'EN' ? 'PT' : 'EN';
            updateMenuUI();
            updateMainLabels();
        }
        return;
    }

    if (gameState.paused) {
        switch(e.key) {
            case 'ArrowUp':
                gameState.menuIndex = (gameState.menuIndex - 1 + 3) % 3;
                updateMenuUI();
                break;
            case 'ArrowDown':
                gameState.menuIndex = (gameState.menuIndex + 1) % 3;
                updateMenuUI();
                break;
            case 'Enter':
                executeMenuOption();
                break;
        }
        return;
    }

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (!keys.left) {
                keys.left = true;
                moveLeft();
                lastKeyPress.left = Date.now();
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (!keys.right) {
                keys.right = true;
                moveRight();
                lastKeyPress.right = Date.now();
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!keys.down) {
                keys.down = true;
                drop();
                gameState.score += 1;
                updateDisplay();
                lastKeyPress.down = Date.now();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            if (!keys.space) {
                keys.space = true;
                hardDrop();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case ' ':
            keys.space = false;
            break;
    }
});

ctx.fillStyle = COLORS.bg;
ctx.fillRect(0, 0, canvas.width, canvas.height);
nextCtx.fillStyle = COLORS.bg;
nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

setupTouchControls();
updateMainLabels();
showStartScreen();