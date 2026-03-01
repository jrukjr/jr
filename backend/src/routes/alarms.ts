import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { resolved = 'false', limit = '100' } = req.query;

    const result = await pool.query(
      `SELECT * FROM alarms 
       WHERE device_id = $1 AND resolved = $2
       ORDER BY timestamp DESC 
       LIMIT $3`,
      [deviceId, resolved === 'true', parseInt(limit as string)]
    );

    res.json({
      count: result.rows.length,
      alarms: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar alarmes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/:alarmId/acknowledge', async (req: AuthRequest, res) => {
  try {
    const { alarmId } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      `UPDATE alarms 
       SET acknowledged = true, 
           acknowledged_by = $1, 
           acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [userId, alarmId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alarme não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao reconhecer alarme:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/:alarmId/resolve', async (req, res) => {
  try {
    const { alarmId } = req.params;

    const result = await pool.query(
      `UPDATE alarms 
       SET resolved = true, 
           resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [alarmId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alarme não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao resolver alarme:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
