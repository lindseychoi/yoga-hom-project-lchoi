/** Customer routes. Instructors can read customers (they pick attendees in UC6); only a Manager changes them. */
import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.get('/', customerController.getAll);
// Must come before /:id, or "check-duplicate" would be read as an ID.
customerRouter.get('/check-duplicate', authorize('Manager'), customerController.checkDuplicate);
customerRouter.get('/:id', customerController.getById);
customerRouter.post('/', authorize('Manager'), customerController.create);
customerRouter.put('/:id', authorize('Manager'), customerController.update);
customerRouter.delete('/:id', authorize('Manager'), customerController.remove);
