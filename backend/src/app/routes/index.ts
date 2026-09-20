import { Router } from 'express';
import { instructorRouter } from './instructor.routes';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Resource routes
apiRouter.use('/instructors', instructorRouter);

// Future routes:
// apiRouter.use('/customers', customerRouter);
// apiRouter.use('/classes', classRouter);
// apiRouter.use('/packages', packageRouter);
// apiRouter.use('/sales', saleRouter);
// apiRouter.use('/attendance', attendanceRouter);
// apiRouter.use('/reports', reportRouter);
// apiRouter.use('/auth', authRouter);
