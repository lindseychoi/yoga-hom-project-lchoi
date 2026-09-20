import { Request, Response, NextFunction } from 'express';
import * as classService from '../services/class.service';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { instructorId } = req.query;
    const classes = await classService.findAll(
      typeof instructorId === 'string' ? instructorId : undefined
    );
    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const found = await classService.findById(req.params.id);
    res.json(found);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await classService.create(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const updated = await classService.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    await classService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
