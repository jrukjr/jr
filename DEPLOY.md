# Guia de Deploy - Sistema de Automação de Draga

Este guia descreve como fazer o deploy completo do sistema em produção.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu 20.04+ ou Amazon Linux 2023)
- Docker e Docker Compose instalados
- Domínio configurado (opcional, mas recomendado)
- Certificado SSL (Let's Encrypt recomendado)
- Conexão Starlink configurada

## 🚀 Deploy com Docker Compose

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 2. Clonar Repositório

```bash
git clone https://github.com/seu-usuario/draga-automation-system.git
cd draga-automation-system
```

### 3. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env na raiz
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
EOF
```

### 4. Iniciar Serviços

```bash
# Iniciar todos os containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 5. Executar Migrações do Banco

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Executar migrações
npm run migrate

# Sair do container
exit
```

### 6. Verificar Instalação

```bash
# Testar API
curl http://localhost:3001/api/health

# Testar Frontend
curl http://localhost:3000
```

## 🌐 Deploy em Nuvem

### AWS (Amazon Web Services)

#### 1. EC2 Instance

```bash
# Criar instância EC2 (t3.medium recomendado)
# Amazon Linux 2023
# Security Group: portas 22, 80, 443, 1883, 3000, 3001

# Conectar via SSH
ssh -i sua-chave.pem ec2-user@seu-ip

# Instalar Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clonar e iniciar
git clone seu-repositorio
cd draga-automation-system
docker-compose up -d
```

#### 2. RDS PostgreSQL (Recomendado para Produção)

```bash
# Criar instância RDS PostgreSQL
# Atualizar DATABASE_URL no docker-compose.yml
DATABASE_URL=postgresql://usuario:senha@seu-rds.amazonaws.com:5432/draga_db
```

#### 3. Load Balancer + Auto Scaling

- Configure Application Load Balancer
- Configure Auto Scaling Group
- Configure Health Checks

### Azure

```bash
# Criar VM Ubuntu
# Instalar Docker e Docker Compose
# Seguir mesmos passos do AWS
```

### Google Cloud Platform

```bash
# Criar Compute Engine instance
# Instalar Docker e Docker Compose
# Seguir mesmos passos do AWS
```

## 🔒 Configuração SSL/TLS

### Let's Encrypt com Nginx

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

### Atualizar docker-compose.yml

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
```

## 📡 Configuração Starlink

### 1. IP Estático ou DDNS

```bash
# Configurar DDNS (No-IP, DynDNS, etc)
# Ou solicitar IP estático com Starlink Business
```

### 2. Port Forwarding

Configure no router Starlink:
- Porta 1883 → MQTT Broker
- Porta 443 → HTTPS
- Porta 80 → HTTP (redirect para HTTPS)

### 3. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1883/tcp
sudo ufw enable
```

## 🔐 Segurança

### 1. MQTT com TLS

```bash
# Gerar certificados
openssl req -new -x509 -days 365 -extensions v3_ca -keyout ca.key -out ca.crt

# Atualizar mosquitto.conf
listener 8883
cafile /mosquitto/config/ca.crt
certfile /mosquitto/config/server.crt
keyfile /mosquitto/config/server.key
```

### 2. Autenticação MQTT

```bash
# Criar arquivo de senhas
mosquitto_passwd -c /mosquitto/config/passwd draga

# Atualizar mosquitto.conf
allow_anonymous false
password_file /mosquitto/config/passwd
```

### 3. Backup Automático

```bash
# Script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U draga draga_db > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://seu-bucket/backups/
EOF

chmod +x backup.sh

# Cron job (diário às 2h)
crontab -e
0 2 * * * /path/to/backup.sh
```

## 📊 Monitoramento

### Prometheus + Grafana

```yaml
# Adicionar ao docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
```

### Logs Centralizados

```bash
# Configurar CloudWatch (AWS)
# Ou ELK Stack (Elasticsearch, Logstash, Kibana)
```

## 🔄 Atualização do Sistema

```bash
# Pull das últimas mudanças
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs nome-do-servico

# Verificar recursos
docker stats

# Reiniciar serviço específico
docker-compose restart nome-do-servico
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Testar conexão
docker-compose exec postgres psql -U draga -d draga_db
```

### MQTT não conecta

```bash
# Testar MQTT
mosquitto_sub -h localhost -t "draga/#" -v

# Ver logs
docker-compose logs mqtt
```

## 📱 Deploy do App Mobile

### Android

```bash
cd mobile
expo build:android -t apk

# Upload para Google Play Store
```

### iOS

```bash
cd mobile
expo build:ios

# Upload para Apple App Store
```

## 🎯 Checklist de Produção

- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup automático ativado
- [ ] Monitoramento configurado
- [ ] Logs centralizados
- [ ] MQTT com autenticação
- [ ] Senhas fortes configuradas
- [ ] Domínio configurado
- [ ] Email de alertas configurado
- [ ] Documentação atualizada

## 📞 Suporte

Para problemas em produção:
1. Verificar logs: `docker-compose logs -f`
2. Verificar status: `docker-compose ps`
3. Verificar recursos: `docker stats`
4. Consultar documentação específica de cada módulo

## 🔗 Links Úteis

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [Let's Encrypt](https://letsencrypt.org/)
- [AWS Documentation](https://docs.aws.amazon.com/)
