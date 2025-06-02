import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

// Validate request
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({ errors: errors.array() });
  };
}; 