# Random Games — Setup de Automação

Dois processos automáticos, em lugares diferentes:

1. **Criação semanal de um jogo** — agente Claude Code rodando na nuvem (routine).
2. **Deploy semanal** — `systemd timer` no servidor **essentia** que faz `git pull` + `docker compose up -d --build`.

```
Quinta 01:00 SP            Quinta 05:00 SP
┌────────────────────┐     ┌──────────────────────────┐
│ Cloud agent        │     │ essentia (systemd timer) │
│ cria jogo, valida, │ ──► │ git pull + docker compose│
│ commit + push main │ git │ up -d --build            │
└────────────────────┘     └──────────────────────────┘
```

---

## Parte 1 — Agente de criação de jogo (nuvem)

Uma *routine* do Claude Code roda **toda quinta-feira às 01:00 (America/Sao_Paulo)** e:

1. Lê `games.json` e jogos existentes para aprender o padrão.
2. Inventa um jogo novo (id kebab-case único) em `public/games/<id>/index.html`, self-contained.
3. Registra em `games.json`.
4. **Valida**: `JSON.parse` do `games.json` e checagem de sintaxe do `<script>` via `new Function(...)`.
5. `git commit` + `git push` para `main` (só se a validação passar).

Gerenciar a routine: https://claude.ai/code/routines

> Existe também o `agent.js` (gerador local por templates). É uma alternativa
> manual: `node agent.js`. A routine na nuvem produz jogos mais variados e não
> depende da máquina de desenvolvimento.

---

## Parte 2 — Deploy automático no servidor essentia

O servidor executa o deploy 1x/semana, **depois** do agente, via `systemd`.

Arquivos:
- `deploy.sh` — faz `git pull` + `docker compose up -d --build` em `/home/gianotto/randon-games`.
- `random-games-deploy.service` — unidade oneshot que chama o `deploy.sh` (roda como usuário `gianotto`).
- `random-games-deploy.timer` — dispara o service toda quinta 05:00 (SP).

> **Pré-requisito:** o usuário `gianotto` precisa estar no grupo `docker`
> (`sudo usermod -aG docker gianotto` e relogar), senão o `docker compose`
> falha por permissão. Confira com `groups gianotto`.

### Instalação (uma vez) no essentia

```bash
# 1. Garantir que o repo está em /home/gianotto/randon-games (clone inicial, se ainda não)
#    git clone https://github.com/Gianotto/random-games /home/gianotto/randon-games

# 2. Trazer os arquivos atualizados
cd /home/gianotto/randon-games && git pull

# 3. Instalar as units do systemd (precisa de sudo só para /etc/systemd/system)
sudo cp /home/gianotto/randon-games/random-games-deploy.service /etc/systemd/system/
sudo cp /home/gianotto/randon-games/random-games-deploy.timer   /etc/systemd/system/
chmod +x /home/gianotto/randon-games/deploy.sh

# 4. Habilitar e iniciar o timer
sudo systemctl daemon-reload
sudo systemctl enable --now random-games-deploy.timer

# 5. Conferir o próximo disparo
systemctl list-timers random-games-deploy.timer
```

### Comandos úteis

```bash
# Próxima execução agendada
systemctl list-timers random-games-deploy.timer

# Rodar o deploy manualmente agora
sudo systemctl start random-games-deploy.service

# Logs
journalctl -u random-games-deploy.service -f
tail -f /home/gianotto/randon-games-deploy.log

# Desabilitar
sudo systemctl disable --now random-games-deploy.timer
```

### Ajustar o horário

Edite `random-games-deploy.timer` e rode `sudo systemctl daemon-reload`:

```ini
[Timer]
OnCalendar=Thu *-*-* 05:00:00 America/Sao_Paulo   # quinta 05:00 SP (padrão)
# OnCalendar=Thu *-*-* 08:00:00                    # equivalente em UTC, se systemd < 240
```

> O sufixo de timezone exige **systemd >= 240**. Verifique com `systemctl --version`.
> Se for mais antigo, remova o sufixo e use a hora no fuso do servidor.

---

## Fluxo completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cloud routine  │     │     GitHub      │     │    essentia     │
│  (Claude Code)  │     │  random-games   │     │ systemd timer   │
└───────┬─────────┘     └────────┬────────┘     └────────┬────────┘
        │ quinta 01:00 SP        │                       │
        │ cria + valida jogo     │                       │
        │ git push ─────────────►│                       │
        │                        │◄──── git pull ────────│ quinta 05:00 SP
        │                        │   docker compose up   │
        │                        │      -d --build       │
        └────────────────────────┴───────────────────────┘
```

---

## Troubleshooting

**Deploy não roda:** `systemctl status random-games-deploy.timer` e
`journalctl -u random-games-deploy.service`.

**Push do agente falha:** confira credenciais git / token na routine
(https://claude.ai/code/routines).

**Hub mostra "ERRO":** `/api/games` falhando — `docker compose logs -f` e
confirme que o rebuild incluiu o `games.json` novo.
