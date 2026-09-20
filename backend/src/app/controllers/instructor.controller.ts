import { Request, Response, NextFunction } from 'express';
import * as instructorService from '../services/instructor.service';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const instructors = await instructorService.findAll();
    res.json(instructors);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.findById(req.params.id);
    res.json(instructor);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.create(req.body);
    res.status(201).json(instructor);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await instructorService.update(req.params.id, req.body);
    res.json(instructor);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await instructorService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const checkDuplicate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName } = req.query;
    const exists = await instructorService.checkDuplicate(
      firstName as string,
      lastName as string
    );
    res.json({ exists });
  } catch (error) {
    next(error);
  }
};
