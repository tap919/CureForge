import express from 'express';

export const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization;
  
  // For safety, require an API key in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.API_SECRET_KEY) {
      console.error('API_SECRET_KEY is missing from environment. Failing closed.');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    if (auth !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // If in development and testing, or API_SECRET_KEY matches 
  if (process.env.NODE_ENV !== 'production' || (process.env.API_SECRET_KEY && auth === `Bearer ${process.env.API_SECRET_KEY}`)) {
     return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};
