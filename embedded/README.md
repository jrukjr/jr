# Sistema Embarcado - Draga

Sistema embarcado para controle e monitoramento da draga, executado em computador embarcado (Raspberry Pi ou similar).

## Funcionalidades

- ✅ Leitura de sensores analógicos 4-20mA
- ✅ Lógica CLP com intertravamentos de segurança
- ✅ Controle de bomba (liga/desliga)
- ✅ Detecção automática de falhas
- ✅ Comunicação MQTT via Starlink
- ✅ Sistema de alarmes
- ✅ Shutdown automático em condições críticas

## Instalação

### Pré-requisitos
- Python 3.9+
- Raspberry Pi ou computador Linux
- Conversor ADC (ADS1115) para leitura 4-20mA
- Módulo relé para controle da bomba

### Instalar Dependências

```bash
cd embedded
pip install -r requirements.txt
```

## Configuração

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
nano .env
```

### Variáveis Importantes

```env
# Broker MQTT (IP do servidor na nuvem via Starlink)
MQTT_BROKER=your-server-ip
MQTT_PORT=1883
MQTT_USERNAME=draga
MQTT_PASSWORD=your-password

# Identificação do dispositivo
DEVICE_ID=draga-001
DEVICE_NAME=Draga Principal
LOCATION=Porto Santos

# Limites de segurança
MAX_PRESSURE=12.0
MAX_TEMPERATURE=90.0
MIN_OIL_LEVEL=20.0
MIN_OIL_PRESSURE=2.0
```

## Hardware

### Conexões

#### Sensores 4-20mA → ADS1115 (ADC)
- Canal 0: Sucção (-1.0 bar)
- Canal 1: Pressão (0-15 bar)
- Canal 2: Nível óleo (0-100%)
- Canal 3: Temperatura (0-150°C)

#### GPIO Raspberry Pi
- GPIO 17: Relé da bomba
- GPIO 27: LED de alarme
- GPIO 22: LED de status

#### Modbus/Serial
- RPM da bomba via Modbus RTU
- Pressão de óleo via Modbus

### Esquema de Ligação

```
Sensor 4-20mA → Resistor 250Ω → ADS1115 → Raspberry Pi (I2C)
                    ↓
                  GND
```

## Execução

### Modo Normal

```bash
cd embedded
python src/main.py
```

### Como Serviço (systemd)

Crie o arquivo `/etc/systemd/system/draga.service`:

```ini
[Unit]
Description=Sistema de Controle de Draga
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/draga-automation-system/embedded
ExecStart=/usr/bin/python3 /home/pi/draga-automation-system/embedded/src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ative o serviço:

```bash
sudo systemctl enable draga.service
sudo systemctl start draga.service
sudo systemctl status draga.service
```

## Modo Simulação

Por padrão, o sistema roda em modo simulação (sem hardware real). Para usar hardware real:

```python
# Em src/main.py, linha 23:
self.sensor_reader = AnalogReader(use_simulation=False)
```

## Lógica CLP

### Intertravamentos de Segurança

1. **Pressão Alta** (>12 bar): Impede partida, desliga bomba
2. **Temperatura Alta** (>90°C): Impede partida, desliga bomba
3. **Nível Óleo Baixo** (<20%): Impede partida, alarme
4. **Pressão Óleo Baixa** (<2 bar): Impede partida, desliga bomba
5. **Entrada de Ar**: Detecta variação brusca, desliga bomba
6. **Falha de Sensor**: Impede partida, alarme

### Sequência de Partida

1. Verificação de pré-condições
2. Ativação de pré-lubrificação
3. Verificação de pressão de óleo
4. Energização do motor
5. Rampa de aceleração
6. Operação normal

### Sequência de Parada

1. Desaceleração gradual
2. Redução de RPM
3. Desenergização do motor
4. Parada completa

## Comunicação MQTT

### Tópicos Publicados

- `draga/{DEVICE_ID}/sensors` - Dados dos sensores (1s)
- `draga/{DEVICE_ID}/status` - Status do PLC (1s)
- `draga/{DEVICE_ID}/alarms` - Alarmes (quando ocorrem)
- `draga/{DEVICE_ID}/heartbeat` - Sinal de vida (30s)

### Tópicos Subscritos

- `draga/{DEVICE_ID}/control` - Comandos de controle

### Comandos Aceitos

```json
{
  "command": "start",
  "params": {}
}
```

Comandos disponíveis:
- `start` - Liga a bomba
- `stop` - Desliga a bomba
- `emergency_stop` - Parada de emergência
- `enable` - Habilita a bomba
- `disable` - Desabilita a bomba
- `reset_alarms` - Reseta alarmes

## Logs

Logs são exibidos no console. Para salvar em arquivo:

```bash
python src/main.py > /var/log/draga.log 2>&1
```

## Troubleshooting

### Erro: "Não conectado ao MQTT"
- Verifique conexão de rede
- Verifique IP do broker no .env
- Teste ping para o servidor

### Erro: "Falha ao ler sensor"
- Verifique conexões I2C
- Execute `i2cdetect -y 1` para ver dispositivos
- Verifique alimentação do ADS1115

### Bomba não liga
- Verifique intertravamentos ativos
- Verifique se bomba está habilitada
- Verifique logs de alarmes

## Manutenção

### Calibração de Sensores

Edite `src/config.py` para ajustar ranges:

```python
SENSOR_RANGES = {
    'suction': {'min': -1.0, 'max': 0.0, 'unit': 'bar'},
    # ...
}
```

### Atualização de Firmware

```bash
cd embedded
git pull
pip install -r requirements.txt --upgrade
sudo systemctl restart draga.service
```

## Segurança

- ⚠️ Nunca desabilite intertravamentos de segurança
- ⚠️ Teste em modo simulação antes de usar hardware real
- ⚠️ Mantenha backup das configurações
- ⚠️ Use TLS para MQTT em produção

## Suporte

Para problemas técnicos, verifique os logs e consulte a documentação principal do projeto.
