/** Attendance routes. Both roles use them; the service limits instructors to their own classes. */
import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../../middleware/auth';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.get('/', attendanceController.getAll);
attendanceRouter.post('/', attendanceController.create);
