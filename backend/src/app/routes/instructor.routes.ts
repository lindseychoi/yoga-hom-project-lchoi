import { Router } from 'express';
import * as instructorController from '../controllers/instructor.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const instructorRouter = Router();

instructorRouter.use(authenticate);

instructorRouter.get('/', instructorController.getAll);
instructorRouter.get('/check-duplicate', instructorController.checkDuplicate);
instructorRouter.get('/:id', instructorController.getById);
instructorRouter.post('/', authorize('Manager'), instructorController.create);
instructorRouter.put('/:id', authorize('Manager'), instructorController.update);
instructorRouter.delete('/:id', authorize('Manager'), instructorController.remove);
