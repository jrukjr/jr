import { Router } from 'express';
import authRoutes from './auth';
import devicesRoutes from './devices';
import sensorsRoutes from './sensors';
import alarmsRoutes from './alarms';
import commandsRoutes from './commands';

const router = Router();

router.use('/auth', authRoutes);
router.use('/devices', devicesRoutes);
router.use('/sensors', sensorsRoutes);
router.use('/alarms', alarmsRoutes);
router.use('/commands', commandsRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
