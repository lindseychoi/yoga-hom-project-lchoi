import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/** An error with an HTTP status code. Services throw it, and errorHandler turns it into a JSON response. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** Sends every error as JSON: known errors keep their status, Mongoose validation failures become 400, anything else is 500. */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      status: 'error',
      message: Object.values(err.errors).map((e) => e.message).join(', '),
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

