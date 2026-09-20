import { Router } from 'express';
import * as instructorController from '../controllers/instructor.controller';

export const instructorRouter = Router();

instructorRouter.get('/', instructorController.getAll);
instructorRouter.get('/check-duplicate', instructorController.checkDuplicate);
instructorRouter.get('/:id', instructorController.getById);
instructorRouter.post('/', instructorController.create);
instructorRouter.put('/:id', instructorController.update);
instructorRouter.delete('/:id', instructorController.remove);
