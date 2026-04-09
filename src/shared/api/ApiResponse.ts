// Contrato de erro retornado em respostas de falha
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Contrato de resposta de sucesso
export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

// Contrato de resposta de falha
export interface ApiFailure {
  success: false;
  data: null;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Retorna uma resposta HTTP padronizada de sucesso
export function ok<T>(data: T, status = 200): Response {
  const body: ApiSuccess<T> = { success: true, data, error: null };
  return Response.json(body, { status });
}

// Retorna uma resposta HTTP padronizada de falha
export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ApiFailure = {
    success: false,
    data: null,
    error: { code, message, details },
  };
  return Response.json(body, { status });
}
