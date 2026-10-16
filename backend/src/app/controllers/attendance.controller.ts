/** HTTP handlers for attendance. Errors go to the shared error handler. */
import { Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service';
import { AuthRequest } from '../../middleware/auth';

// authenticate runs on every attendance route, so req.user is always set here
export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sheets = await attendanceService.findAll(req.user!.role, req.user!.instructorId);
    res.json(sheets);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Returns { record, notifications } so the screen can show the check-in messages that were sent
    const result = await attendanceService.record(
      req.user!.role,
      req.user!.instructorId,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
