import { AppError } from '@/src/domain/errors/AppError';
import { fail } from './ApiResponse';

// Centraliza o tratamento de erros dos route handlers.
// Erros de domínio conhecidos (AppError) viram respostas HTTP estruturadas.
// Erros inesperados retornam 500 sem vazar detalhes internos ao cliente.
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.statusCode, error.details);
  }

  console.error('[Unhandled error]', error);
  return fail('INTERNAL_SERVER_ERROR', 'Erro interno do servidor', 500);
}
