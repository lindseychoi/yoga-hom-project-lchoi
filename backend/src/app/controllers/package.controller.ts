/** HTTP handlers for packages. Each one calls the service and passes any error to the shared error handler. */
import { Request, Response, NextFunction } from 'express';
import * as packageService from '../services/package.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await packageService.findAll();
    res.json(packages);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const found = await packageService.findById(req.params.id);
    res.json(found);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await packageService.create(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const updated = await packageService.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await packageService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
