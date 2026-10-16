/** Package routes. Only a Manager can see or change packages. */
import { Router } from 'express';
import * as packageController from '../controllers/package.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const packageRouter = Router();

packageRouter.use(authenticate, authorize('Manager'));

packageRouter.get('/', packageController.getAll);
packageRouter.get('/:id', packageController.getById);
packageRouter.post('/', packageController.create);
packageRouter.put('/:id', packageController.update);
packageRouter.delete('/:id', packageController.remove);
