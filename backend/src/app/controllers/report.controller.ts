/** HTTP handlers for reports. Errors go to the shared error handler. */
import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { AuthRequest } from '../../middleware/auth';

export const packageSales = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await reportService.packageSales());
  } catch (error) {
    next(error);
  }
};

export const instructors = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await reportService.instructors());
  } catch (error) {
    next(error);
  }
};

export const customers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await reportService.customers());
  } catch (error) {
    next(error);
  }
};

/** ?month=YYYY-MM */
export const teacherPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await reportService.teacherPayment(String(req.query.month ?? '')));
  } catch (error) {
    next(error);
  }
};

/** The logged-in instructor's own row of the teacher payment report (UC9). ?month=YYYY-MM */
export const myPerformance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [row] = await reportService.teacherPayment(
      String(req.query.month ?? ''),
      req.user!.instructorId
    );
    res.json(row);
  } catch (error) {
    next(error);
  }
};
