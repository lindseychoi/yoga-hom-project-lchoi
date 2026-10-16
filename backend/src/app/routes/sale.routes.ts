/** Sale routes. Only a Manager records or sees sales. */
import { Router } from 'express';
import * as saleController from '../controllers/sale.controller';
import { authenticate, authorize } from '../../middleware/auth';

export const saleRouter = Router();

saleRouter.use(authenticate, authorize('Manager'));

saleRouter.get('/', saleController.getAll);
saleRouter.post('/', saleController.create);
