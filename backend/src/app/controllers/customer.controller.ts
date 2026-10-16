/** HTTP handlers for customers. Each one calls the service and passes any error to the shared error handler. */
import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customer.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await customerService.findAll();
    res.json(customers);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.findById(req.params.id);
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Returns { customer, notification } so the screen can show the welcome message that was sent
    const result = await customerService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await customerService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const checkDuplicate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName } = req.query;
    const exists = await customerService.checkDuplicate(
      firstName as string,
      lastName as string
    );
    res.json({ exists });
  } catch (error) {
    next(error);
  }
};
