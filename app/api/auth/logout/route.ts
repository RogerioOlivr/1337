import { deleteSession } from '@/src/shared/auth/session';
import { ok } from '@/src/shared/api/ApiResponse';

export async function POST() {
  await deleteSession();
  return ok(null);
}
