# 🚀 Guia Rápido de Início

Este guia vai te ajudar a colocar o sistema funcionando em **menos de 10 minutos**.

## ⚡ Início Rápido com Docker

### 1. Pré-requisitos

- Docker e Docker Compose instalados
- Portas 3000, 3001, 5432, 1883 disponíveis

### 2. Iniciar Sistema

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/draga-automation-system.git
cd draga-automation-system

# Inicie todos os serviços
docker-compose up -d

# Aguarde ~30 segundos para os serviços iniciarem
```

### 3. Executar Migrações

```bash
# Entre no container do backend
docker-compose exec backend sh

# Execute as migrações
npm run migrate

# Saia do container
exit
```

### 4. Acessar o Sistema

- **Frontend Web**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **Login**: 
  - Usuário: `admin`
  - Senha: `admin123`

## 🖥️ Desenvolvimento Local (Sem Docker)

### 1. Backend

```bash
# Instalar PostgreSQL
# Ubuntu: sudo apt install postgresql
# Mac: brew install postgresql

# Criar banco de dados
createdb draga_db

# Instalar MQTT Broker
# Ubuntu: sudo apt install mosquitto
# Mac: brew install mosquitto

# Configurar backend
cd backend
npm install
cp .env.example .env
# Edite .env com suas configurações

# Executar migrações
npm run migrate

# Iniciar servidor
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edite .env se necessário

# Iniciar aplicação
npm start
```

### 3. Sistema Embarcado (Simulação)

```bash
cd embedded
pip install -r requirements.txt
cp .env.example .env
# Edite .env com IP do broker MQTT

# Executar sistema
python src/main.py
```

## 📱 Testar Sistema

### 1. Login

Acesse http://localhost:3000 e faça login com:
- Usuário: `admin`
- Senha: `admin123`

### 2. Visualizar Dashboard

Você verá:
- Dados dos sensores em tempo real (simulados)
- Gráficos de histórico
- Controles da bomba
- Alarmes ativos

### 3. Testar Controle

Clique em "Ligar" para ligar a bomba (simulado).
Observe os logs no terminal do sistema embarcado.

## 🔧 Comandos Úteis

### Docker

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Reiniciar um serviço
docker-compose restart backend

# Ver status dos containers
docker-compose ps
```

### Desenvolvimento

```bash
# Backend
cd backend
npm run dev          # Modo desenvolvimento
npm run build        # Build para produção
npm start            # Iniciar produção

# Frontend
cd frontend
npm start            # Modo desenvolvimento
npm run build        # Build para produção

# Sistema Embarcado
cd embedded
python src/main.py   # Executar
```

## 🐛 Problemas Comuns

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :3001

# Matar processo
kill -9 PID
```

### Erro de conexão com banco de dados

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Frontend não conecta ao backend

1. Verifique se o backend está rodando: http://localhost:3001/api/health
2. Verifique o arquivo `.env` do frontend
3. Limpe o cache do navegador

## 📚 Próximos Passos

1. Leia o [README.md](README.md) completo
2. Explore a [documentação da API](backend/README.md)
3. Configure o [sistema embarcado](embedded/README.md) em hardware real
4. Consulte o [guia de deploy](DEPLOY.md) para produção

## 🆘 Precisa de Ajuda?

- Verifique os logs: `docker-compose logs -f`
- Consulte a documentação de cada módulo
- Verifique as issues no GitHub

## ✅ Checklist de Verificação

- [ ] Docker e Docker Compose instalados
- [ ] Portas 3000, 3001, 5432, 1883 disponíveis
- [ ] Containers rodando: `docker-compose ps`
- [ ] Migrações executadas
- [ ] Frontend acessível em http://localhost:3000
- [ ] Backend respondendo em http://localhost:3001/api/health
- [ ] Login funcionando (admin/admin123)
- [ ] Dashboard exibindo dados simulados

Pronto! Seu sistema está funcionando! 🎉
