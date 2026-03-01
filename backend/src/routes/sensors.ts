import { Router } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/:deviceId/latest', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM sensor_data 
       WHERE device_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum dado encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, limit = '1000' } = req.query;

    let query = 'SELECT * FROM sensor_data WHERE device_id = $1';
    const params: any[] = [deviceId];

    if (start) {
      params.push(start);
      query += ` AND timestamp >= $${params.length}`;
    }

    if (end) {
      params.push(end);
      query += ` AND timestamp <= $${params.length}`;
    }

    query += ' ORDER BY timestamp DESC';
    
    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = '24' } = req.query;

    const result = await pool.query(
      `SELECT 
        AVG(suction_value) as avg_suction,
        MAX(suction_value) as max_suction,
        MIN(suction_value) as min_suction,
        AVG(pressure_value) as avg_pressure,
        MAX(pressure_value) as max_pressure,
        MIN(pressure_value) as min_pressure,
        AVG(rpm_value) as avg_rpm,
        MAX(rpm_value) as max_rpm,
        MIN(rpm_value) as min_rpm,
        AVG(oil_level_value) as avg_oil_level,
        MIN(oil_level_value) as min_oil_level,
        AVG(temperature_value) as avg_temperature,
        MAX(temperature_value) as max_temperature,
        MIN(temperature_value) as min_temperature,
        AVG(oil_pressure_value) as avg_oil_pressure,
        MIN(oil_pressure_value) as min_oil_pressure
       FROM sensor_data 
       WHERE device_id = $1 
       AND timestamp >= NOW() - INTERVAL '${parseInt(hours as string)} hours'`,
      [deviceId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
