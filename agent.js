#!/usr/bin/env node
/**
 * Random Games Agent - Gera jogos aleatórios semanalmente
 * 
 * Uso: node agent.js
 * 
 * Este script:
 * 1. Gera um novo jogo baseado em templates
 * 2. Verifica se o jogo roda sem erros
 * 3. Faz git commit e push
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Templates de jogos disponíveis
const GAME_TEMPLATES = [
    {
        type: 'platform',
        name: 'Platform Jumper',
        description: 'Pule plataformas e colete itens',
        colors: ['#ff6b35', '#ff006e', '#8338ec', '#00f5d4'],
        mechanics: ['jump', 'collect', 'avoid']
    },
    {
        type: 'shooter',
        name: 'Space Shooter',
        description: 'Destrua inimigos no espaço',
        colors: ['#00ff88', '#0f0', '#00ffff', '#ff00ff'],
        mechanics: ['shoot', 'dodge', 'powerup']
    },
    {
        type: 'runner',
        name: 'Endless Runner',
        description: 'Corra infinitamente desviando obstáculos',
        colors: ['#ffbe0b', '#ff6b35', '#ff006e', '#8338ec'],
        mechanics: ['jump', 'slide', 'dash']
    },
    {
        type: 'puzzle',
        name: 'Block Puzzle',
        description: 'Resolva puzzles combinando blocos',
        colors: ['#00f5d4', '#3a86ff', '#8338ec', '#ff006e'],
        mechanics: ['match', 'rotate', 'clear']
    },
    {
        type: 'maze',
        name: 'Maze Explorer',
        description: 'Navegue por labirintos coletando tesouros',
        colors: ['#8b4513', '#daa520', '#228b22', '#4682b4'],
        mechanics: ['navigate', 'collect', 'escape']
    },
    {
        type: 'defense',
        name: 'Tower Defense',
        description: 'Defenda sua base de ondas de inimigos',
        colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44'],
        mechanics: ['build', 'upgrade', 'defend']
    }
];

// Temas visuais
const THEMES = [
    { name: 'Neon', bg: '#0d0d0f', accent: '#ff6b35' },
    { name: 'Retro', bg: '#1a1a2e', accent: '#e94560' },
    { name: 'Nature', bg: '#0d3328', accent: '#00ff88' },
    { name: 'Cyber', bg: '#0a0a1a', accent: '#00f5d4' },
    { name: 'Fire', bg: '#1a0a0a', accent: '#ff4400' },
    { name: 'Ice', bg: '#0a1a2e', accent: '#aaddff' }
];

// Palavras para gerar nomes
const PREFIXES = ['Super', 'Mega', 'Ultra', 'Hyper', 'Cyber', 'Neo', 'Retro', 'Infinite', 'Cosmic', 'Quantum'];
const NOUNS = ['Jump', 'Dash', 'Blast', 'Rush', 'Storm', 'Quest', 'Battle', 'Survivor', 'Hero', 'Legend', 'Dream', 'Star'];
const SUFFIXES = ['3000', 'X', 'Pro', 'Deluxe', 'Gold', 'Plus', 'Extreme', 'Unlimited', 'Forever', 'Revolution'];

function generateGameId() {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)].toLowerCase();
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)].toLowerCase();
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)].toLowerCase();
    return `${prefix}-${noun}-${suffix}`.replace(/\s+/g, '-');
}

function generateGameName() {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${prefix} ${noun}`;
}

function generateSubtitle() {
    const editions = ['DELUXE', 'PRO', 'XTREME', 'GOLD', 'PLUS', 'NEON', 'RETRO', 'COSMIC', 'INFINITE', 'ULTIMATE'];
    return editions[Math.floor(Math.random() * editions.length)] + ' EDITION';
}

function getRandomDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function getRandomTags(template) {
    const baseTags = [template.type, 'arcade', 'random'];
    const extraTags = ['skill', 'action', 'casual', 'retro', 'fast-paced'];
    const shuffled = extraTags.sort(() => 0.5 - Math.random());
    return [...baseTags, ...shuffled.slice(0, 2)];
}

// Geradores de jogos específicos
function generatePlatformGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; }
        #game { display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; background: rgba(0,0,0,0.8); }
        #ui { position: fixed; top: 20px; left: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; text-shadow: 0 0 40px ${theme.accent}; }
        #gameOver p { font-size: 24px; margin-bottom: 30px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
        #gameOver button:hover { box-shadow: 0 0 30px ${theme.accent}; }
    </style>
</head>
<body>
    <div id="game"><canvas id="canvas" width="800" height="600"></canvas></div>
    <div id="ui">SCORE: <span id="score">0</span> | LIVES: <span id="lives">3</span></div>
    <div id="gameOver">
        <h1>GAME OVER</h1>
        <p>Score: <span id="finalScore">0</span></p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        let score = 0, lives = 3, gameRunning = true;
        const gravity = 0.6, jumpPower = -12;
        
        const player = { x: 100, y: 400, vx: 0, vy: 0, width: 30, height: 30, onGround: false, color: colors[0] };
        const platforms = [];
        const coins = [];
        const enemies = [];
        
        // Gerar plataformas
        for (let i = 0; i < 8; i++) {
            platforms.push({ x: i * 120 + 50, y: 450 + Math.random() * 100, width: 100, height: 20 });
        }
        // Chão
        platforms.push({ x: 0, y: 580, width: 800, height: 20 });
        
        // Gerar moedas
        for (let i = 0; i < 10; i++) {
            coins.push({ x: Math.random() * 750 + 25, y: Math.random() * 400 + 50, size: 10, collected: false });
        }
        
        // Gerar inimigos
        for (let i = 0; i < 5; i++) {
            enemies.push({ x: Math.random() * 700 + 50, y: Math.random() * 400 + 100, vx: (Math.random() - 0.5) * 4, size: 20 });
        }
        
        const keys = {};
        document.addEventListener('keydown', e => keys[e.key] = true);
        document.addEventListener('keyup', e => keys[e.key] = false);
        
        function update() {
            if (!gameRunning) return;
            
            // Movimento
            if (keys['ArrowLeft']) player.vx = -5;
            else if (keys['ArrowRight']) player.vx = 5;
            else player.vx *= 0.8;
            
            // Pulo
            if (keys['ArrowUp'] && player.onGround) {
                player.vy = jumpPower;
                player.onGround = false;
            }
            
            // Gravidade
            player.vy += gravity;
            player.x += player.vx;
            player.y += player.vy;
            
            // Colisão com plataformas
            player.onGround = false;
            platforms.forEach(p => {
                if (player.x + player.width > p.x && player.x < p.x + p.width &&
                    player.y + player.height > p.y && player.y + player.height < p.y + p.height + 10 &&
                    player.vy > 0) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                }
            });
            
            // Queda no abismo
            if (player.y > 600) {
                lives--;
                player.x = 100; player.y = 400; player.vy = 0;
                if (lives <= 0) gameOver();
            }
            
            // Limites
            if (player.x < 0) player.x = 0;
            if (player.x > 770) player.x = 770;
            
            // Coletar moedas
            coins.forEach(c => {
                if (!c.collected && Math.hypot(player.x + 15 - c.x, player.y + 15 - c.y) < 25) {
                    c.collected = true;
                    score += 100;
                }
            });
            
            // Inimigos
            enemies.forEach(e => {
                e.x += e.vx;
                if (e.x < 0 || e.x > 780) e.vx *= -1;
                if (Math.hypot(player.x + 15 - e.x, player.y + 15 - e.y) < 25) {
                    lives--;
                    player.x = 100; player.y = 400; player.vy = 0;
                    if (lives <= 0) gameOver();
                }
            });
            
            document.getElementById('score').textContent = score;
            document.getElementById('lives').textContent = lives;
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 800, 600);
            
            // Grid
            ctx.strokeStyle = '${theme.accent}20';
            ctx.lineWidth = 1;
            for (let i = 0; i < 800; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
            }
            for (let i = 0; i < 600; i += 40) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
            }
            
            // Plataformas
            ctx.fillStyle = colors[1];
            platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
            
            // Moedas
            ctx.fillStyle = colors[2];
            coins.forEach(c => {
                if (!c.collected) {
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Inimigos
            ctx.fillStyle = colors[3];
            enemies.forEach(e => {
                ctx.fillRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
            });
            
            // Jogador
            ctx.shadowColor = player.color;
            ctx.shadowBlur = 20;
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.shadowBlur = 0;
        }
        
        function gameOver() {
            gameRunning = false;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'flex';
            submitScore();
        }
        
        function submitScore() {
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: score })
            }).catch(() => {});
        }
        
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }
        
        loop();
    </script>
</body>
</html>`;
}

function generateShooterGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; }
        #game { display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; }
        #ui { position: fixed; top: 20px; left: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
    </style>
</head>
<body>
    <div id="game"><canvas id="canvas" width="600" height="800"></canvas></div>
    <div id="ui">SCORE: <span id="score">0</span> | WAVES: <span id="wave">1</span></div>
    <div id="gameOver">
        <h1>GAME OVER</h1>
        <p>Score: <span id="finalScore">0</span></p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        let score = 0, wave = 1, gameRunning = true;
        
        const player = { x: 300, y: 700, width: 40, height: 40, speed: 6 };
        const bullets = [];
        const enemies = [];
        const particles = [];
        
        const keys = {};
        document.addEventListener('keydown', e => {
            keys[e.key] = true;
            if (e.key === ' ') {
                bullets.push({ x: player.x, y: player.y - 10, vy: -10, size: 6 });
            }
        });
        document.addEventListener('keyup', e => keys[e.key] = false);
        
        function spawnEnemy() {
            enemies.push({
                x: Math.random() * 560 + 20,
                y: -30,
                size: 25 + Math.random() * 15,
                hp: 1 + Math.floor(wave / 3),
                vy: 2 + Math.random() * 2 + wave * 0.3,
                vx: (Math.random() - 0.5) * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        
        function update() {
            if (!gameRunning) return;
            
            // Movimento
            if (keys['ArrowLeft'] && player.x > 20) player.x -= player.speed;
            if (keys['ArrowRight'] && player.x < 580) player.x += player.speed;
            if (keys['ArrowUp'] && player.y > 400) player.y -= player.speed;
            if (keys['ArrowDown'] && player.y < 760) player.y += player.speed;
            
            // Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].y += bullets[i].vy;
                if (bullets[i].y < -10) bullets.splice(i, 1);
            }
            
            // Spawn inimigos
            if (Math.random() < 0.02 + wave * 0.005) spawnEnemy();
            
            // Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                e.y += e.vy;
                e.x += e.vx;
                
                if (e.x < 20 || e.x > 580) e.vx *= -1;
                
                // Colisão com bullets
                for (let j = bullets.length - 1; j >= 0; j--) {
                    const b = bullets[j];
                    if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
                        e.hp--;
                        bullets.splice(j, 1);
                        // Partículas
                        for (let k = 0; k < 5; k++) {
                            particles.push({ x: e.x, y: e.y, vx: (Math.random()-.5)*10, vy: (Math.random()-.5)*10, life: 20, color: e.color });
                        }
                        if (e.hp <= 0) {
                            score += 100 * wave;
                            enemies.splice(i, 1);
                            break;
                        }
                    }
                }
                
                // Colisão com player
                if (Math.hypot(player.x - e.x, player.y - e.y) < e.size + 20) {
                    gameOver();
                }
                
                // Passou
                if (e.y > 820) {
                    enemies.splice(i, 1);
                }
            }
            
            // Partículas
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) particles.splice(i, 1);
            }
            
            // Wave
            if (score > wave * 1000) wave++;
            
            document.getElementById('score').textContent = score;
            document.getElementById('wave').textContent = wave;
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 600, 800);
            
            // Grid
            ctx.strokeStyle = '${theme.accent}15';
            for (let i = 0; i < 600; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 800); ctx.stroke();
            }
            for (let i = 0; i < 800; i += 40) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
            }
            
            // Player
            ctx.shadowColor = colors[0];
            ctx.shadowBlur = 20;
            ctx.fillStyle = colors[0];
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - 20);
            ctx.lineTo(player.x - 20, player.y + 20);
            ctx.lineTo(player.x + 20, player.y + 20);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Bullets
            ctx.fillStyle = colors[1];
            bullets.forEach(b => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Enemies
            enemies.forEach(e => {
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Partículas
            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 20;
                ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
                ctx.globalAlpha = 1;
            });
        }
        
        function gameOver() {
            gameRunning = false;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'flex';
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: score })
            }).catch(() => {});
        }
        
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }
        
        loop();
    </script>
</body>
</html>`;
}

function generateRunnerGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; }
        #game { display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; }
        #ui { position: fixed; top: 20px; left: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
    </style>
</head>
<body>
    <div id="game"><canvas id="canvas" width="900" height="400"></canvas></div>
    <div id="ui">SCORE: <span id="score">0</span> | SPEED: <span id="speed">1</span>x</div>
    <div id="gameOver">
        <h1>GAME OVER</h1>
        <p>Score: <span id="finalScore">0</span></p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        let score = 0, gameSpeed = 1, gameRunning = true;
        
        const player = { x: 100, y: 280, width: 50, height: 80, vy: 0, jumping: false };
        const obstacles = [];
        const collectibles = [];
        
        const groundY = 360;
        
        document.addEventListener('keydown', e => {
            if ((e.key === 'ArrowUp' || e.key === ' ') && !player.jumping) {
                player.vy = -15;
                player.jumping = true;
            }
        });
        
        function spawnObstacle() {
            const types = ['cactus', 'rock', 'bird'];
            const type = types[Math.floor(Math.random() * types.length)];
            obstacles.push({
                x: 950,
                y: type === 'bird' ? 200 + Math.random() * 100 : groundY - 40,
                width: type === 'bird' ? 50 : 30 + Math.random() * 20,
                height: type === 'bird' ? 40 : 50 + Math.random() * 30,
                type: type,
                speed: 5 + gameSpeed * 2
            });
        }
        
        function spawnCollectible() {
            collectibles.push({
                x: 950,
                y: 150 + Math.random() * 150,
                size: 15,
                collected: false
            });
        }
        
        function update() {
            if (!gameRunning) return;
            
            // Gravidade
            player.vy += 0.8;
            player.y += player.vy;
            
            if (player.y >= groundY - player.height) {
                player.y = groundY - player.height;
                player.vy = 0;
                player.jumping = false;
            }
            
            // Spawn
            if (Math.random() < 0.015) spawnObstacle();
            if (Math.random() < 0.01) spawnCollectible();
            
            // Obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const o = obstacles[i];
                o.x -= o.speed;
                
                // Colisão
                if (player.x < o.x + o.width && player.x + player.width > o.x &&
                    player.y < o.y + o.height && player.y + player.height > o.y) {
                    gameOver();
                }
                
                if (o.x + o.width < 0) obstacles.splice(i, 1);
            }
            
            // Collectibles
            for (let i = collectibles.length - 1; i >= 0; i--) {
                const c = collectibles[i];
                c.x -= 5 + gameSpeed;
                
                if (!c.collected && Math.hypot(player.x + 25 - c.x, player.y + 40 - c.y) < 40) {
                    c.collected = true;
                    score += 50;
                }
                
                if (c.x < 0) collectibles.splice(i, 1);
            }
            
            score++;
            gameSpeed = 1 + Math.floor(score / 500) * 0.5;
            
            document.getElementById('score').textContent = score;
            document.getElementById('speed').textContent = gameSpeed.toFixed(1);
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 900, 400);
            
            // Ground
            ctx.fillStyle = colors[1];
            ctx.fillRect(0, groundY, 900, 40);
            
            // Grid lines
            ctx.strokeStyle = '${theme.accent}20';
            for (let i = 0; i < 900; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i - (score % 50), 0);
                ctx.lineTo(i - (score % 50), groundY);
                ctx.stroke();
            }
            
            // Player
            ctx.shadowColor = colors[0];
            ctx.shadowBlur = 20;
            ctx.fillStyle = colors[0];
            ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.shadowBlur = 0;
            
            // Obstacles
            ctx.fillStyle = colors[3];
            obstacles.forEach(o => {
                if (o.type === 'bird') {
                    ctx.beginPath();
                    ctx.moveTo(o.x, o.y + o.height/2);
                    ctx.lineTo(o.x + o.width/2, o.y);
                    ctx.lineTo(o.x + o.width, o.y + o.height/2);
                    ctx.lineTo(o.x + o.width/2, o.y + o.height);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(o.x, o.y, o.width, o.height);
                }
            });
            
            // Collectibles
            ctx.fillStyle = colors[2];
            collectibles.forEach(c => {
                if (!c.collected) {
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
        
        function gameOver() {
            gameRunning = false;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'flex';
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: score })
            }).catch(() => {});
        }
        
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }
        
        loop();
    </script>
</body>
</html>`;
}

function generatePuzzleGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; }
        #ui { position: fixed; top: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; display: flex; gap: 40px; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
        #instructions { position: fixed; bottom: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div id="ui"><span>SCORE: <span id="score">0</span></span><span>LEVEL: <span id="level">1</span></span></div>
    <canvas id="canvas" width="400" height="600"></canvas>
    <div id="instructions">← → para mover | ↑ para rotacionar | ↓ para descer</div>
    <div id="gameOver">
        <h1>GAME OVER</h1>
        <p>Score: <span id="finalScore">0</span></p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        const COLS = 10, ROWS = 20, BLOCK_SIZE = 30;
        
        const SHAPES = {
            I: [[1,1,1,1]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]],
            Z: [[1,1,0],[0,1,1]],
            J: [[1,0,0],[1,1,1]],
            L: [[0,0,1],[1,1,1]]
        };
        
        let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        let score = 0, level = 1, gameRunning = true;
        let currentPiece = null, dropTime = 0, dropInterval = 1000;
        
        function randomPiece() {
            const types = Object.keys(SHAPES);
            const type = types[Math.floor(Math.random() * types.length)];
            return { type, shape: SHAPES[type], x: 4, y: 0, color: colors[Math.floor(Math.random() * colors.length)] };
        }
        
        function rotate(piece) {
            const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
            return { ...piece, shape: rotated };
        }
        
        function collision(piece, dx, dy, shape = piece.shape) {
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const nx = piece.x + x + dx, ny = piece.y + y + dy;
                        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                        if (ny >= 0 && board[ny][nx]) return true;
                    }
                }
            }
            return false;
        }
        
        function merge() {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
                });
            });
        }
        
        function clearLines() {
            let lines = 0;
            for (let y = ROWS - 1; y >= 0; y--) {
                if (board[y].every(cell => cell !== 0)) {
                    board.splice(y, 1);
                    board.unshift(Array(COLS).fill(0));
                    lines++;
                    y++;
                }
            }
            if (lines > 0) {
                score += [0, 100, 300, 500, 800][lines] * level;
                level = Math.floor(score / 1000) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 80);
            }
        }
        
        function spawnPiece() {
            currentPiece = randomPiece();
            if (collision(currentPiece, 0, 0)) gameOver();
        }
        
        function update(time) {
            if (!gameRunning) return;
            
            if (time - dropTime > dropInterval) {
                if (!collision(currentPiece, 0, 1)) {
                    currentPiece.y++;
                } else {
                    merge();
                    clearLines();
                    spawnPiece();
                }
                dropTime = time;
            }
            
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 400, 600);
            
            // Grid
            ctx.strokeStyle = '${theme.accent}20';
            for (let x = 0; x <= COLS; x++) {
                ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, 0); ctx.lineTo(x * BLOCK_SIZE, 600); ctx.stroke();
            }
            for (let y = 0; y <= ROWS; y++) {
                ctx.beginPath(); ctx.moveTo(0, y * BLOCK_SIZE); ctx.lineTo(400, y * BLOCK_SIZE); ctx.stroke();
            }
            
            // Board
            board.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        ctx.fillStyle = cell;
                        ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                    }
                });
            });
            
            // Current piece
            if (currentPiece) {
                ctx.fillStyle = currentPiece.color;
                currentPiece.shape.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val) {
                            ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE + 1, (currentPiece.y + y) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                        }
                    });
                });
            }
        }
        
        function gameOver() {
            gameRunning = false;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'flex';
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: score })
            }).catch(() => {});
        }
        
        document.addEventListener('keydown', e => {
            if (!gameRunning || !currentPiece) return;
            if (e.key === 'ArrowLeft' && !collision(currentPiece, -1, 0)) currentPiece.x--;
            if (e.key === 'ArrowRight' && !collision(currentPiece, 1, 0)) currentPiece.x++;
            if (e.key === 'ArrowDown' && !collision(currentPiece, 0, 1)) { currentPiece.y++; score += 1; }
            if (e.key === 'ArrowUp') {
                const rotated = rotate(currentPiece);
                if (!collision(rotated, 0, 0)) currentPiece = rotated;
            }
        });
        
        spawnPiece();
        function loop(time) {
            update(time);
            draw();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    </script>
</body>
</html>`;
}

function generateMazeGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; }
        #ui { position: fixed; top: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; display: flex; gap: 40px; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
    </style>
</head>
<body>
    <div id="ui"><span>LEVEL: <span id="level">1</span></span><span>TREASURES: <span id="treasures">0</span></span></div>
    <canvas id="canvas" width="600" height="600"></canvas>
    <div id="gameOver">
        <h1>PARABÉNS!</h1>
        <p>Você completou o labirinto!</p>
        <p>Score: <span id="finalScore">0</span></p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        const CELL_SIZE = 30;
        const COLS = 20, ROWS = 20;
        
        let maze = [], player = { x: 1, y: 1 }, treasures = [], level = 1, score = 0;
        let exit = { x: 18, y: 18 };
        
        function generateMaze() {
            maze = Array(ROWS).fill(null).map(() => Array(COLS).fill(1));
            
            const stack = [{ x: 1, y: 1 }];
            maze[1][1] = 0;
            
            const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];
            
            while (stack.length > 0) {
                const current = stack[stack.length - 1];
                const neighbors = [];
                
                for (const [dx, dy] of dirs) {
                    const nx = current.x + dx, ny = current.y + dy;
                    if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && maze[ny][nx] === 1) {
                        neighbors.push({ x: nx, y: ny, dx: dx/2, dy: dy/2 });
                    }
                }
                
                if (neighbors.length > 0) {
                    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                    maze[next.y][next.x] = 0;
                    maze[current.y + next.dy][current.x + next.dx] = 0;
                    stack.push({ x: next.x, y: next.y });
                } else {
                    stack.pop();
                }
            }
            
            // Adicionar algumas passagens extras
            for (let i = 0; i < 10; i++) {
                const x = Math.floor(Math.random() * (COLS - 2)) + 1;
                const y = Math.floor(Math.random() * (ROWS - 2)) + 1;
                maze[y][x] = 0;
            }
            
            // Spawn treasures
            treasures = [];
            for (let i = 0; i < 5 + level; i++) {
                let tx, ty;
                do {
                    tx = Math.floor(Math.random() * COLS);
                    ty = Math.floor(Math.random() * ROWS);
                } while (maze[ty][tx] === 1 || (tx === 1 && ty === 1) || (tx === exit.x && ty === exit.y));
                treasures.push({ x: tx, y: ty, collected: false });
            }
        }
        
        function update() {
            // Check treasure collection
            treasures.forEach(t => {
                if (!t.collected && player.x === t.x && player.y === t.y) {
                    t.collected = true;
                    score += 100;
                }
            });
            
            // Check exit
            if (player.x === exit.x && player.y === exit.y && treasures.every(t => t.collected)) {
                level++;
                score += 500;
                if (level > 3) {
                    gameOver();
                } else {
                    generateMaze();
                    player = { x: 1, y: 1 };
                }
            }
            
            document.getElementById('level').textContent = level;
            document.getElementById('treasures').textContent = treasures.filter(t => t.collected).length + '/' + treasures.length;
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 600, 600);
            
            // Maze
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (maze[y][x] === 1) {
                        ctx.fillStyle = colors[1];
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    } else {
                        ctx.fillStyle = '${theme.accent}10';
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    }
                }
            }
            
            // Grid lines
            ctx.strokeStyle = '${theme.accent}30';
            ctx.lineWidth = 1;
            for (let i = 0; i <= COLS; i++) {
                ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, 600); ctx.stroke();
            }
            for (let i = 0; i <= ROWS; i++) {
                ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(600, i * CELL_SIZE); ctx.stroke();
            }
            
            // Treasures
            treasures.forEach(t => {
                if (!t.collected) {
                    ctx.fillStyle = colors[2];
                    ctx.beginPath();
                    ctx.arc(t.x * CELL_SIZE + CELL_SIZE/2, t.y * CELL_SIZE + CELL_SIZE/2, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Exit
            ctx.fillStyle = treasures.every(t => t.collected) ? colors[3] : '#666';
            ctx.fillRect(exit.x * CELL_SIZE + 2, exit.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            
            // Player
            ctx.fillStyle = colors[0];
            ctx.shadowColor = colors[0];
            ctx.shadowBlur = 15;
            ctx.fillRect(player.x * CELL_SIZE + 4, player.y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            ctx.shadowBlur = 0;
        }
        
        function gameOver() {
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'flex';
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: score })
            }).catch(() => {});
        }
        
        document.addEventListener('keydown', e => {
            let nx = player.x, ny = player.y;
            if (e.key === 'ArrowUp') ny--;
            if (e.key === 'ArrowDown') ny++;
            if (e.key === 'ArrowLeft') nx--;
            if (e.key === 'ArrowRight') nx++;
            
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && maze[ny][nx] === 0) {
                player.x = nx;
                player.y = ny;
            }
        });
        
        generateMaze();
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }
        loop();
    </script>
</body>
</html>`;
}

function generateDefenseGame(theme, colors) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} — {{SUBTITLE}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: ${theme.bg}; font-family: 'Chakra Petch', monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        canvas { border: 3px solid ${theme.accent}; box-shadow: 0 0 60px ${theme.accent}40; }
        #ui { position: fixed; top: 20px; color: #fff; font-size: 20px; text-shadow: 0 0 10px ${theme.accent}; display: flex; gap: 40px; }
        #gameOver { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        #gameOver h1 { font-size: 60px; color: ${theme.accent}; margin-bottom: 20px; }
        #gameOver button { padding: 15px 40px; font-size: 20px; background: ${theme.accent}; border: none; color: #000; cursor: pointer; font-family: inherit; font-weight: bold; }
    </style>
</head>
<body>
    <div id="ui"><span>WAVE: <span id="wave">1</span></span><span>BASE HP: <span id="hp">100</span></span><span>MONEY: $<span id="money">100</span></span></div>
    <canvas id="canvas" width="800" height="600"></canvas>
    <div id="gameOver">
        <h1>BASE DESTRUÍDA</h1>
        <p>Você sobreviveu <span id="finalWave">0</span> ondas!</p>
        <button onclick="location.reload()">JOGAR NOVAMENTE</button>
    </div>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const colors = ${JSON.stringify(colors)};
        
        const CELL_SIZE = 40;
        const COLS = 20, ROWS = 15;
        
        let wave = 1, baseHp = 100, money = 100, gameRunning = true;
        let enemies = [], towers = [], projectiles = [];
        
        const path = [];
        for (let i = 0; i < COLS; i++) path.push({ x: i, y: 7 });
        
        function spawnEnemy() {
            enemies.push({
                x: 0,
                y: 7 * CELL_SIZE + CELL_SIZE/2,
                hp: 20 + wave * 5,
                maxHp: 20 + wave * 5,
                speed: 1 + wave * 0.1,
                reward: 10 + wave * 2
            });
        }
        
        function update() {
            if (!gameRunning) return;
            
            // Spawn enemies
            if (Math.random() < 0.01 + wave * 0.002 && enemies.length < 20) {
                spawnEnemy();
            }
            
            // Move enemies
            enemies.forEach(e => {
                e.x += e.speed;
                if (e.x >= COLS * CELL_SIZE) {
                    baseHp -= 10;
                    e.hp = 0;
                }
            });
            enemies = enemies.filter(e => e.hp > 0);
            
            // Towers shoot
            towers.forEach(t => {
                t.cooldown--;
                if (t.cooldown <= 0) {
                    const target = enemies.find(e => Math.hypot(e.x - (t.x * CELL_SIZE + CELL_SIZE/2), e.y - (t.y * CELL_SIZE + CELL_SIZE/2)) < t.range);
                    if (target) {
                        projectiles.push({
                            x: t.x * CELL_SIZE + CELL_SIZE/2,
                            y: t.y * CELL_SIZE + CELL_SIZE/2,
                            tx: target.x,
                            ty: target.y,
                            damage: t.damage,
                            speed: 8
                        });
                        t.cooldown = t.fireRate;
                    }
                }
            });
            
            // Move projectiles
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const p = projectiles[i];
                const dx = p.tx - p.x, dy = p.ty - p.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < p.speed) {
                    // Hit
                    const target = enemies.find(e => Math.hypot(e.x - p.tx, e.y - p.ty) < 20);
                    if (target) {
                        target.hp -= p.damage;
                        if (target.hp <= 0) {
                            money += target.reward;
                            enemies = enemies.filter(e => e.hp > 0);
                        }
                    }
                    projectiles.splice(i, 1);
                } else {
                    p.x += (dx / dist) * p.speed;
                    p.y += (dy / dist) * p.speed;
                }
            }
            
            // Next wave
            if (enemies.length === 0 && Math.random() < 0.001) {
                wave++;
                money += 50;
            }
            
            if (baseHp <= 0) gameOver();
            
            document.getElementById('wave').textContent = wave;
            document.getElementById('hp').textContent = baseHp;
            document.getElementById('money').textContent = money;
        }
        
        function draw() {
            ctx.fillStyle = '${theme.bg}';
            ctx.fillRect(0, 0, 800, 600);
            
            // Grid
            ctx.strokeStyle = '${theme.accent}20';
            for (let x = 0; x <= COLS; x++) {
                ctx.beginPath(); ctx.moveTo(x * CELL_SIZE, 0); ctx.lineTo(x * CELL_SIZE, 600); ctx.stroke();
            }
            for (let y = 0; y <= ROWS; y++) {
                ctx.beginPath(); ctx.moveTo(0, y * CELL_SIZE); ctx.lineTo(800, y * CELL_SIZE); ctx.stroke();
            }
            
            // Path
            ctx.fillStyle = colors[1] + '40';
            path.forEach(p => ctx.fillRect(p.x * CELL_SIZE, p.y * CELL_SIZE, CELL_SIZE, CELL_SIZE));
            
            // Base
            ctx.fillStyle = baseHp > 50 ? colors[0] : '#ff0000';
            ctx.fillRect(760, 260, 40, 80);
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText('BASE', 765, 300);
            
            // Towers
            towers.forEach(t => {
                ctx.fillStyle = colors[2];
                ctx.fillRect(t.x * CELL_SIZE + 5, t.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
                // Range indicator
                ctx.strokeStyle = colors[2] + '30';
                ctx.beginPath();
                ctx.arc(t.x * CELL_SIZE + CELL_SIZE/2, t.y * CELL_SIZE + CELL_SIZE/2, t.range, 0, Math.PI * 2);
                ctx.stroke();
            });
            
            // Enemies
            enemies.forEach(e => {
                const hpPct = e.hp / e.maxHp;
                ctx.fillStyle = hpPct > 0.5 ? colors[3] : '#ff6666';
                ctx.beginPath();
                ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
                ctx.fill();
                // HP bar
                ctx.fillStyle = '#000';
                ctx.fillRect(e.x - 10, e.y - 20, 20, 4);
                ctx.fillStyle = hpPct > 0.5 ? '#0f0' : '#f00';
                ctx.fillRect(e.x - 10, e.y - 20, 20 * hpPct, 4);
            });
            
            // Projectiles
            ctx.fillStyle = colors[2];
            projectiles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        function gameOver() {
            gameRunning = false;
            document.getElementById('finalWave').textContent = wave;
            document.getElementById('gameOver').style.display = 'flex';
            fetch('/api/scores/{{ID}}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'PLAYER', score: wave * 1000 })
            }).catch(() => {});
        }
        
        canvas.addEventListener('click', e => {
            if (!gameRunning) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
            const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
            
            // Check if on path or has tower
            if (path.some(p => p.x === x && p.y === y)) return;
            if (towers.some(t => t.x === x && t.y === y)) return;
            
            if (money >= 50) {
                money -= 50;
                towers.push({ x, y, range: 120, damage: 10, fireRate: 30, cooldown: 0 });
            }
        });
        
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }
        loop();
    </script>
</body>
</html>`;
}

// Gerador principal
async function generateGame() {
    console.log('🎮 Random Games Agent - Gerando novo jogo...');

    // Selecionar template e tema aleatórios
    const template = GAME_TEMPLATES[Math.floor(Math.random() * GAME_TEMPLATES.length)];
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    const gameId = generateGameId();
    const gameName = generateGameName();
    const subtitle = generateSubtitle();

    console.log(`   Template: ${template.type}`);
    console.log(`   Nome: ${gameName}`);
    console.log(`   ID: ${gameId}`);

    // Gerar HTML do jogo
    let html;
    switch (template.type) {
        case 'platform':
            html = generatePlatformGame(theme, template.colors);
            break;
        case 'shooter':
            html = generateShooterGame(theme, template.colors);
            break;
        case 'runner':
            html = generateRunnerGame(theme, template.colors);
            break;
        case 'puzzle':
            html = generatePuzzleGame(theme, template.colors);
            break;
        case 'maze':
            html = generateMazeGame(theme, template.colors);
            break;
        case 'defense':
            html = generateDefenseGame(theme, template.colors);
            break;
        default:
            html = generatePlatformGame(theme, template.colors);
    }

    // Substituir placeholders
    html = html
        .replace(/{{ID}}/g, gameId)
        .replace(/{{NAME}}/g, gameName)
        .replace(/{{SUBTITLE}}/g, subtitle);

    // Criar diretório do jogo
    const gameDir = path.join(__dirname, 'public', 'games', gameId);
    await fs.mkdir(gameDir, { recursive: true });

    // Salvar arquivo HTML
    await fs.writeFile(path.join(gameDir, 'index.html'), html, 'utf8');

    // Atualizar games.json
    const gamesFile = path.join(__dirname, 'games.json');
    const gamesData = await fs.readFile(gamesFile, 'utf8');
    const games = JSON.parse(gamesData);

    const newGame = {
        id: gameId,
        name: gameName,
        subtitle: subtitle,
        description: template.description,
        path: `/games/${gameId}/`,
        color: theme.accent,
        added: getRandomDate(),
        tags: getRandomTags(template)
    };

    games.push(newGame);
    await fs.writeFile(gamesFile, JSON.stringify(games, null, 2), 'utf8');

    console.log(`   ✓ Jogo criado em: ${gameDir}`);

    return { gameId, gameName, gameDir };
}

// Verificação de erros
async function verifyGame(gameDir) {
    console.log('🔍 Verificando jogo...');

    const indexPath = path.join(gameDir, 'index.html');

    // Verificar se arquivo existe
    try {
        await fs.access(indexPath);
    } catch {
        throw new Error('Arquivo index.html não encontrado');
    }

    // Verificar sintaxe básica do HTML
    const content = await fs.readFile(indexPath, 'utf8');

    if (!content.includes('<!DOCTYPE html>')) {
        throw new Error('DOCTYPE não encontrado');
    }

    if (!content.includes('<canvas')) {
        throw new Error('Elemento canvas não encontrado');
    }

    if (!content.includes('requestAnimationFrame')) {
        throw new Error('Game loop não encontrado');
    }

    // Verificar se não há placeholders não substituídos
    if (content.includes('{{') || content.includes('}}')) {
        throw new Error('Placeholders não substituídos encontrados');
    }

    console.log('   ✓ Verificação básica passou');

    // Tentar validar com um navegador headless (se puppeteer disponível)
    // Por enquanto, apenas verificamos a sintaxe

    return true;
}

// Operações Git
function gitOperations(gameId, gameName) {
    console.log('📦 Operações Git...');

    try {
        // Git add
        execSync('git add -A', { cwd: __dirname, stdio: 'pipe' });
        console.log('   ✓ git add');

        // Git commit - escapar aspas no nome
        const safeName = gameName.replace(/"/g, '\\"');
        const commitMsg = `feat: add new random game "${safeName}" (${gameId})`;
        execSync(`git commit -m "${commitMsg}"`, { cwd: __dirname, stdio: 'pipe' });
        console.log('   ✓ git commit');

        // Git push
        execSync('git push origin HEAD', { cwd: __dirname, stdio: 'pipe' });
        console.log('   ✓ git push');

        return true;
    } catch (error) {
        console.error('   ✗ Erro nas operações Git:', error.message);
        return false;
    }
}

// Função principal
async function main() {
    try {
        console.log('='.repeat(60));
        console.log('RANDOM GAMES AGENT');
        console.log('='.repeat(60));

        // Verificar se estamos em um repo git
        try {
            execSync('git rev-parse --git-dir', { cwd: __dirname, stdio: 'pipe' });
        } catch {
            throw new Error('Não é um repositório Git. Execute: git init');
        }

        // Gerar jogo
        const { gameId, gameName, gameDir } = await generateGame();

        // Verificar
        await verifyGame(gameDir);

        // Git commit e push
        const gitSuccess = gitOperations(gameId, gameName);

        if (gitSuccess) {
            console.log('='.repeat(60));
            console.log('✅ SUCESSO!');
            console.log(`   Jogo: ${gameName} (${gameId})`);
            console.log(`   URL:  /games/${gameId}/`);
            console.log('='.repeat(60));
        } else {
            console.log('⚠️  Jogo gerado mas falha no Git');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { generateGame, verifyGame };