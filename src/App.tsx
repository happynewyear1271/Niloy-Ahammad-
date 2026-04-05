/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Users, Send, Play, RotateCcw, X, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Score {
  name: string;
  level: number;
  date: string;
}

export default function App() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [visits, setVisits] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [playerName, setPlayerName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballPos = useRef({ x: 150, y: 200 });
  const ballVel = useRef({ dx: 2, dy: 2 });
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);

  // Initialize data from localStorage
  useEffect(() => {
    const savedVisits = parseInt(localStorage.getItem('verse_visits') || '0', 10);
    const newVisits = savedVisits + 1;
    localStorage.setItem('verse_visits', newVisits.toString());
    setVisits(newVisits);

    const savedScores = JSON.parse(localStorage.getItem('verse_scores') || '[]');
    setLeaderboard(savedScores);
    if (savedScores.length > 0) {
      setHighScore(savedScores[0].level);
    }
  }, []);

  const saveScore = useCallback((name: string, finalScore: number) => {
    const newScore: Score = {
      name: name || 'Anonymous',
      level: finalScore,
      date: new Date().toLocaleDateString(),
    };
    const updatedLeaderboard = [...leaderboard, newScore]
      .sort((a, b) => b.level - a.level)
      .slice(0, 10);
    
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('verse_scores', JSON.stringify(updatedLeaderboard));
  }, [leaderboard]);

  const update = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    if (lastTimeRef.current !== undefined) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update position
      ballPos.current.x += ballVel.current.dx;
      ballPos.current.y += ballVel.current.dy;

      // Wall collisions
      if (ballPos.current.x < 15 || ballPos.current.x > canvas.width - 15) {
        ballVel.current.dx *= -1;
      }
      
      // Top collision
      if (ballPos.current.y < 15) {
        ballVel.current.dy *= -1;
      }

      // Bottom collision (Game Over)
      if (ballPos.current.y > canvas.height - 15) {
        setGameState('gameOver');
        return;
      }

      // Draw Ball
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        ballPos.current.x - 5, 
        ballPos.current.y - 5, 
        2, 
        ballPos.current.x, 
        ballPos.current.y, 
        15
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, '#38bdf8');
      gradient.addColorStop(1, '#0ea5e9');
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0ea5e9';
      ctx.fillStyle = gradient;
      ctx.arc(ballPos.current.x, ballPos.current.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    }
    
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  const startGame = () => {
    ballPos.current = { x: 150, y: 100 };
    ballVel.current = { dx: (Math.random() - 0.5) * 6, dy: 3 };
    setScore(0);
    setGameState('playing');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dist = Math.sqrt(
      Math.pow(mouseX - ballPos.current.x, 2) + 
      Math.pow(mouseY - ballPos.current.y, 2)
    );

    if (dist < 40) { // Larger hit area for better gameplay
      ballVel.current.dy = -Math.abs(ballVel.current.dy) - 0.2; // Bounce up and speed up slightly
      ballVel.current.dx += (Math.random() - 0.5) * 2; // Add some randomness to horizontal speed
      setScore(prev => prev + 1);
    }
  };

  const submitScore = () => {
    saveScore(playerName, score);
    setGameState('idle');
    setPlayerName('');
  };

  return (
    <div className="min-h-screen bg-[#0b0f2a] text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[340px] bg-[#0f1440] rounded-[20px] p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-[16px] font-bold flex items-center gap-1">
            <Play className="w-4 h-4 fill-current text-emerald-400" />
            Verse Ball Pool
          </h3>
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="bg-[#1b2060] px-2.5 py-1.5 rounded-[10px] text-[12px] flex items-center gap-1 hover:bg-[#252b7a] transition-colors"
          >
            <Trophy className="w-3 h-3 text-yellow-500" />
            Leaderboard
          </button>
        </div>

        {/* Game Area / Card Content */}
        <div className="bg-[#13186b] rounded-[15px] p-6 text-center relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
          {gameState === 'playing' ? (
            <canvas
              ref={canvasRef}
              width={280}
              height={350}
              onClick={handleCanvasClick}
              className="bg-black/20 rounded-xl cursor-crosshair w-full h-full absolute inset-0"
            />
          ) : gameState === 'idle' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <h2 className="text-[22px] font-bold mb-2.5">Ready to Play?</h2>
              <p className="text-[13px] text-[#ccc] leading-relaxed mb-5">
                Tap the ball to keep it in the air.<br />Don't let it hit the bottom!
              </p>
              <button 
                onClick={startGame}
                className="bg-gradient-to-r from-[#00ff9c] to-[#00c8ff] border-none py-3 px-5 rounded-[25px] font-bold cursor-pointer text-black transition-transform active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                START MISSION
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 w-full"
            >
              <h2 className="text-[22px] font-bold mb-1 text-red-500">GAME OVER</h2>
              <p className="text-[13px] text-[#ccc] mb-4">Score: <span className="text-white font-bold">{score}</span></p>
              
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00ff9c] transition-colors"
                />
                <button 
                  onClick={submitScore}
                  className="w-full bg-gradient-to-r from-[#00ff9c] to-[#00c8ff] text-black font-bold py-2.5 rounded-xl transition-all active:scale-95"
                >
                  SAVE SCORE
                </button>
                <button 
                  onClick={startGame}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  TRY AGAIN
                </button>
              </div>
            </motion.div>
          )}

          {/* Score overlay during play */}
          {gameState === 'playing' && (
            <div className="absolute top-4 right-4 pointer-events-none z-20">
              <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <span className="text-emerald-400 font-black">{score}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-between items-center text-[12px]">
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-3 h-3" />
            <span>Visitors: {visits}</span>
          </div>

          <div className="text-center flex-1 text-[#00c8ff] font-bold">
            <a 
              href="https://x.com/VerseEcosystem" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              @VerseEcosystem
            </a>
          </div>

          <a 
            href="https://t.me/GetVerse" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#00c8ff] cursor-pointer flex items-center gap-1 hover:underline"
          >
            <Send className="w-3 h-3" />
            Join Group
          </a>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-md bg-[#1e293b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-bold">Top Champions</h2>
                </div>
                <button 
                  onClick={() => setShowLeaderboard(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-slate-300 text-black' : 
                            index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-slate-400'
                          }`}>
                            {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                          </div>
                          <div>
                            <p className="font-bold">{entry.name}</p>
                            <p className="text-xs text-slate-500">{entry.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-emerald-400">{entry.level}</p>
                          <p className="text-[10px] uppercase tracking-tighter text-slate-500">Level</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No scores yet. Be the first!</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5">
                <button 
                  onClick={() => setShowLeaderboard(false)}
                  className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition-all"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
