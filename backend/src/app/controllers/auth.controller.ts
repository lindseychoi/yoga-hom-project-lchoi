/** Login handler. Rejects a request that doesn't send an email and a password as text. */
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../../middleware/error-handler';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError(400, 'Email and password are required');
    }
    res.json(await authService.login(email, password));
  } catch (error) {
    next(error);
  }
};
