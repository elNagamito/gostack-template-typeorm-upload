import 'reflect-metadata';
import { Request, Response } from 'express';
import 'express-async-errors';

import app from './app';
import AppError from './errors/AppError';

app.listen(3333, () => {
  console.log('🚀 Server started on port 3333!');
});

// Tratamento global de erros
app.use((err: Error, request: Request, response: Response) => {
  // Caso a mensagem de erro tenha sido disparada pela classe de erros, ela será exibida aqui
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error(err);

  return response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});
