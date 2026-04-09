import { openApiSpec } from '@/src/shared/api/openapi';

export function GET() {
  return Response.json(openApiSpec);
}
