#!/bin/bash

# Nobilis MES - Docker Setup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Nobilis MES Docker Setup ===${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run with sudo${NC}"
   exit 1
fi

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
apt update
apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group
CURRENT_USER=${SUDO_USER:-$USER}
usermod -aG docker $CURRENT_USER

echo -e "${GREEN}✅ Docker installed successfully!${NC}"
echo ""
echo -e "${YELLOW}Version info:${NC}"
docker --version
docker compose version
echo ""
echo -e "${YELLOW}⚠️  Log out and log back in for docker group changes to take effect${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Create project structure"
echo "2. Run: docker compose up -d"
echo ""
