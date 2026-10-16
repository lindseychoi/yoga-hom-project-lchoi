/** HTTP handlers for classes. getAll accepts an optional ?instructorId= filter. Errors go to the shared error handler. */
import { Request, Response, NextFunction } from 'express';
import * as classService from '../services/class.service';
import { AuthRequest } from '../../middleware/auth';

// authenticate runs on every class route, so req.user is always set here
export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instructorId } = req.query;
    const classes = await classService.findAll(
      req.user!.role,
      req.user!.instructorId,
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

export const publish = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await classService.publish(String(req.params.id), req.user!.id));
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
