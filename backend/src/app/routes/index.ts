import { Router } from 'express';
import { instructorRouter } from './instructor.routes';
import { authRouter } from './auth.routes';
import { classRouter } from './class.routes';
import { packageRouter } from './package.routes';
import { customerRouter } from './customer.routes';
import { saleRouter } from './sale.routes';
import { attendanceRouter } from './attendance.routes';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Resource routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/instructors', instructorRouter);
apiRouter.use('/classes', classRouter);
apiRouter.use('/packages', packageRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/sales', saleRouter);
apiRouter.use('/attendance', attendanceRouter);

// Future routes:
// apiRouter.use('/reports', reportRouter);
