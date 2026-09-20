import { Router } from 'express';
import { instructorRouter } from './instructor.routes';
import { authRouter } from './auth.routes';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Resource routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/instructors', instructorRouter);

// Future routes:
// apiRouter.use('/customers', customerRouter);
// apiRouter.use('/classes', classRouter);
// apiRouter.use('/packages', packageRouter);
// apiRouter.use('/sales', saleRouter);
// apiRouter.use('/attendance', attendanceRouter);
// apiRouter.use('/reports', reportRouter);
