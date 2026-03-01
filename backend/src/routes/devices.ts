import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM devices ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar dispositivos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM devices WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { device_id, device_name, location } = req.body;

    if (!device_id || !device_name) {
      return res.status(400).json({ error: 'device_id e device_name são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO devices (device_id, device_name, location)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [device_id, device_name, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Device ID já existe' });
    }
    console.error('Erro ao criar dispositivo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
