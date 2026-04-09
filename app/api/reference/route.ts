import { ApiReference } from '@scalar/nextjs-api-reference';
import { openApiSpec } from '@/src/shared/api/openapi';

export const GET = ApiReference({
  content: openApiSpec,
  pageTitle: '1337 API',
});
