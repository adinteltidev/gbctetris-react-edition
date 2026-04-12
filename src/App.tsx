import { useEffect, useRef } from 'react';
import './style.css';

function App() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    import('./script.js');
  }, []);

  return (
    <div className="container">
      <div className="game-wrapper">
        <div className="screen-border">
          <div className="game-screen">
            <canvas id="tetris" width="300" height="600"></canvas>
            <div id="overlay" className="overlay">
              <div id="startScreen" className="screen">
                <h1>Vando's TETRIS</h1>
                <p>Press ENTER to Start</p>
                <div className="controls">
                  <p id="move">← → Move</p>
                  <p id="rotate">↑ Rotate</p>
                  <p id="drop">↓ Soft Drop</p>
                  <p id="hardDrop">SPACE Hard Drop</p>
                  <p id="pauseResume">Backspace Pause/Resume</p>
                  <p id="ccredits">C For Credits</p>
                  <p id="language">L For Languages</p>
                </div>
              </div>
              <div id="gameOverScreen" className="screen hidden">
                <h1>GAME OVER</h1>
                <p id="finalScore"></p>
                <p id="gamerestart">Press ENTER to Start</p>
                <p id="gametitle">Backspace for Main Menu</p>
              </div>
              <div id="pauseScreen" className="screen hidden">
                <h1 id="txt-paused">PAUSED</h1>
                <div className="menu-container">
                  <div className="menu-item selected" data-index="0" id="opt-resume">RESUME</div>
                  <div className="menu-item" data-index="1" id="opt-sound">SOUND: ON</div>
                  <div className="menu-item" data-index="2" id="opt-lang">LANGUAGE: EN</div>
                </div>
                <p id="txt-esc-resume">Press Backspace to Resume</p>
              </div>
              <div id="creditsScreen" className="screen hidden">
                <h1>CREDITS</h1>
                <div className="controls">
                  <h2>Developed by Adriano Pimentel</h2>
                  <br />
                  <h3>Special thanks to:</h3>
                  <p id="thanks1">Vando Griffitt<br />(Happy Birthday 2026!)</p>
                  <p id="thanks2">Alex Griffitt</p>
                  <p id="thanks3">Gabriel Pimentel</p>
                  <br />
                  <p id="creditsReturn">Back to Return</p>
                </div>
              </div>
            </div>
            <div className="touch-controls">
              <div className="d-pad">
                <button id="touch-left" className="touch-btn">◀</button>
                <div className="d-pad-vertical">
                  <button id="touch-up" className="touch-btn">▲</button>
                  <button id="touch-down" className="touch-btn">▼</button>
                </div>
                <button id="touch-right" className="touch-btn">▶</button>
              </div>
              <div className="action-buttons">
                <button id="touch-back" className="touch-btn action-c">BACK</button>
                <button id="touch-hard" className="touch-btn action-a">HARD</button>
                <button id="touch-pause" className="touch-btn action-b">START</button>
              </div>
            </div>
          </div>
        </div>
        <div className="info-panel">
          <div className="info-box">
            <div className="label">SCORE</div>
            <div id="score" className="value">0</div>
          </div>
          <div className="info-box">
            <div className="label">LEVEL</div>
            <div id="level" className="value">1</div>
          </div>
          <div className="info-box">
            <div className="label">LINES</div>
            <div id="lines" className="value">0</div>
          </div>
          <div className="info-box next-piece-box">
            <div className="label">NEXT</div>
            <canvas id="nextPiece" width="120" height="80"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
