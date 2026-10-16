/** Report routes. The four studio reports are Manager-only; "me" is an instructor's own performance (UC9). */
import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.get('/package-sales', authorize('Manager'), reportController.packageSales);
reportRouter.get('/instructors', authorize('Manager'), reportController.instructors);
reportRouter.get('/customers', authorize('Manager'), reportController.customers);
reportRouter.get('/teacher-payment', authorize('Manager'), reportController.teacherPayment); // ?month=YYYY-MM
reportRouter.get('/me', authorize('Instructor'), reportController.myPerformance); // ?month=YYYY-MM
