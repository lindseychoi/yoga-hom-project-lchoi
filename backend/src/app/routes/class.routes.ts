/** Class routes. Anyone logged in can read them, and only a Manager can create, edit, or delete. */
import { Router } from 'express';
import * as classController from '../controllers/class.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const classRouter = Router();

classRouter.use(authenticate);

classRouter.get('/', classController.getAll);
classRouter.get('/:id', classController.getById);
classRouter.post('/', authorize('Manager'), classController.create);
classRouter.put('/:id', authorize('Manager'), classController.update);
classRouter.delete('/:id', authorize('Manager'), classController.remove);
