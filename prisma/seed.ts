/**
 * Seed de desenvolvimento: promove um usuário para admin.
 * Uso: npx tsx prisma/seed.ts <email>
 *
 * Exemplo: npx tsx prisma/seed.ts rogerio@email.com
 */
import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../lib/generated/prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Uso: npx tsx prisma/seed.ts <email>')
    process.exit(1)
  }

  const usuario = await prisma.usuario.update({
    where: { email },
    data: { role: 'admin' },
    select: { id: true, nome: true, email: true, role: true },
  })

  console.log(`✅ Usuário promovido para admin:`, usuario)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
