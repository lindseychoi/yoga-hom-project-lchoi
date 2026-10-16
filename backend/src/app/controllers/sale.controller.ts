/** HTTP handlers for sales. Each one calls the service and passes any error to the shared error handler. */
import { Request, Response, NextFunction } from 'express';
import * as saleService from '../services/sale.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sales = await saleService.findAll();
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Returns { sale, customer } so the screen can show the customer's new balance
    const result = await saleService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
