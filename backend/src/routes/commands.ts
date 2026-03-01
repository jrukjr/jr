import { Router } from 'express';
import pool from '../config/database';
import mqttBroker from '../mqtt/broker';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/:deviceId', async (req: AuthRequest, res) => {
  try {
    const { deviceId } = req.params;
    const { command, params = {} } = req.body;
    const userId = req.user?.id;

    if (!command) {
      return res.status(400).json({ error: 'Comando é obrigatório' });
    }

    const validCommands = ['start', 'stop', 'emergency_stop', 'enable', 'disable', 'reset_alarms'];
    if (!validCommands.includes(command)) {
      return res.status(400).json({ error: 'Comando inválido' });
    }

    const result = await pool.query(
      `INSERT INTO commands (device_id, command, params, issued_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [deviceId, command, JSON.stringify(params), userId]
    );

    const commandRecord = result.rows[0];

    const published = mqttBroker.publishCommand(deviceId, command, params);

    if (!published) {
      return res.status(503).json({ 
        error: 'Falha ao enviar comando (MQTT não conectado)',
        command: commandRecord 
      });
    }

    res.status(201).json({
      message: 'Comando enviado com sucesso',
      command: commandRecord,
    });
  } catch (error) {
    console.error('Erro ao enviar comando:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = '50' } = req.query;

    const result = await pool.query(
      `SELECT c.*, u.username 
       FROM commands c
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE c.device_id = $1
       ORDER BY c.issued_at DESC
       LIMIT $2`,
      [deviceId, parseInt(limit as string)]
    );

    res.json({
      count: result.rows.length,
      commands: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de comandos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
