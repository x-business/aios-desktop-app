import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { PostgrestError } from '@supabase/supabase-js';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  
  // Log error
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // Send response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

export const supabaseErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((error as PostgrestError).code) {
    const pgError = error as PostgrestError;
    return res.status(400).json({
      error: 'Database Error',
      message: pgError.message,
      code: pgError.code
    });
  }
  next(error);
}; 