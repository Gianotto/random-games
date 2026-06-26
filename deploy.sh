#!/bin/bash
#
# Random Games Deploy Script
# Executado no servidor essentia para fazer git pull e rebuild do container
#
# Uso: ./deploy.sh

set -euo pipefail

REPO_DIR="/opt/random-games"
LOG_FILE="/var/log/random-games-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Iniciando deploy do Random Games"
log "=========================================="

# Verificar se diretório existe
if [ ! -d "$REPO_DIR" ]; then
    log "ERRO: Diretório $REPO_DIR não existe"
    exit 1
fi

cd "$REPO_DIR"

# Verificar se é um repo git
if [ ! -d ".git" ]; then
    log "ERRO: $REPO_DIR não é um repositório git"
    exit 1
fi

# Git pull
log "Executando git pull..."
if ! git pull origin HEAD 2>&1 | tee -a "$LOG_FILE"; then
    log "AVISO: Possíveis conflitos no git pull, tentando reset..."
    git fetch origin
    git reset --hard origin/HEAD 2>&1 | tee -a "$LOG_FILE"
fi

log "Git pull concluído"

# Docker compose up com rebuild
log "Reconstruindo containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>&1 | tee -a "$LOG_FILE" || true
    docker-compose up -d --build 2>&1 | tee -a "$LOG_FILE"
elif docker compose version &> /dev/null; then
    docker compose down 2>&1 | tee -a "$LOG_FILE" || true
    docker compose up -d --build 2>&1 | tee -a "$LOG_FILE"
else
    log "ERRO: Docker Compose não encontrado"
    exit 1
fi

# Verificar se container está rodando
sleep 5
if docker ps | grep -q "random-games"; then
    log "✓ Container está rodando"
else
    log "AVISO: Container pode não estar rodando, verifique manualmente"
fi

log "=========================================="
log "Deploy concluído com sucesso!"
log "=========================================="