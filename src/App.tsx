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
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Verse Ball Pool</h1>
        </div>
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/10"
        >
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">Leaderboard</span>
        </button>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-1">Current Score</span>
            <span className="text-3xl font-black text-emerald-400">{score}</span>
          </div>
          <div className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-1">Best Level</span>
            <span className="text-3xl font-black text-blue-400">{highScore}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative group">
          <canvas
            ref={canvasRef}
            width={350}
            height={500}
            onClick={handleCanvasClick}
            className={`bg-[#0ea5e9]/10 rounded-3xl border-2 border-[#0ea5e9]/30 shadow-2xl shadow-[#0ea5e9]/10 cursor-crosshair transition-all duration-500 ${gameState === 'playing' ? 'scale-100 opacity-100' : 'scale-95 opacity-50 grayscale-[0.5]'}`}
          />

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="bg-[#1e293b]/90 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-2">Ready to Play?</h2>
                  <p className="text-slate-400 text-sm mb-6">Tap the ball to keep it in the air. Don't let it hit the bottom!</p>
                  <button 
                    onClick={startGame}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    START MISSION
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'gameOver' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="bg-[#1e293b]/95 backdrop-blur-md p-8 rounded-3xl border border-red-500/30 shadow-2xl">
                  <h2 className="text-3xl font-black text-red-500 mb-2">GAME OVER</h2>
                  <p className="text-slate-400 text-sm mb-4">You reached level <span className="text-white font-bold">{score}</span></p>
                  
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button 
                      onClick={submitScore}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      SAVE SCORE
                    </button>
                    <button 
                      onClick={startGame}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      TRY AGAIN
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-slate-500 text-sm flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tap to Bounce</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Avoid Bottom</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-[#1e293b] border-t border-white/5 p-4 flex justify-around items-center text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="w-4 h-4" />
          <span>Visitors: <span className="text-white font-mono">{visits}</span></span>
        </div>
        <a 
          href="https://t.me/GetVerse" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Join Group</span>
        </a>
      </footer>

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
