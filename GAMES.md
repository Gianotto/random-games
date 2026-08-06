# Como adicionar um novo jogo

## 1. Criar o jogo

Crie a pasta e o HTML autocontido do jogo:

```
public/games/meu-jogo/
└── index.html
```

O jogo deve ser um único `index.html` sem dependências externas de build.

## 2. Configurar o ranking

No `index.html` do jogo, use a API de scores com o ID do jogo:

```javascript
const GAME_ID  = 'meu-jogo';      // mesmo slug da pasta
const API_BASE = '../..';         // dois níveis acima de public/games/

async function fetchTopScores() {
  const res = await fetch(`${API_BASE}/api/scores/${GAME_ID}`, { cache: 'no-store' });
  return res.json();
}

async function submitScore(name, score) {
  const res = await fetch(`${API_BASE}/api/scores/${GAME_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
  return res.json();
}
```

## 3. Registrar no games.json

Adicione uma entrada em `games.json` na raiz:

```json
{
  "id": "meu-jogo",
  "name": "Nome do Jogo",
  "subtitle": "TAGLINE AQUI",
  "description": "Uma frase descrevendo o jogo.",
  "path": "/games/meu-jogo/",
  "color": "#ffd700",
  "added": "YYYY-MM-DD",
  "tags": ["arcade", "platform"]
}
```

O hub automaticamente inclui o novo jogo no sorteio.

## 4. Adicionar botão ← HUB

No jogo, inclua um link de volta ao hub:

```html
<button onclick="window.location.href='/'">← HUB</button>
```

## 5. Criar arquivo de scores (produção)

O servidor cria o arquivo automaticamente na primeira submissão.
Para inicializar manualmente:

```bash
echo "[]" > /var/lib/random-games/scores/meu-jogo.json
```

## Convenções

- ID do jogo: apenas letras minúsculas, números e hifens (`[a-z0-9-]`)
- Score máximo: 1.000.000
- Nome do jogador: até 12 caracteres, maiúsculas
- Estilo visual: dark purple/black, pixel art, Courier New

## IDs em uso

| ID               | Jogo            | Adicionado   |
|------------------|-----------------|--------------|
| torre-infinita   | Torre Infinita  | 2025-01-01   |
| pitfall          | Pitfall         | 2026-08-06   |
