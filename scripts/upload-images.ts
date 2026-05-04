/**
 * Faz upload de todas as imagens de public/images/ para o Cloudinary.
 * Uso: npx tsx scripts/upload-images.ts
 *
 * Saída: imprime uma tabela com nome do arquivo → URL no Cloudinary
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Variáveis Cloudinary ausentes no .env')
  console.error('   Necessário: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
  process.exit(1)
}
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const CLOUDINARY_FOLDER = '1337/produtos'

async function uploadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: CLOUDINARY_FOLDER,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 1200, crop: 'limit', fetch_format: 'webp', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload falhou'))
        resolve(result.secure_url)
      }
    )
  })
}

async function main() {
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))

  if (files.length === 0) {
    console.log('Nenhuma imagem encontrada em public/images/')
    return
  }

  console.log(`\nFazendo upload de ${files.length} imagens para o Cloudinary...\n`)

  const results: Record<string, string> = {}
  let ok = 0
  let fail = 0

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file)
    process.stdout.write(`  ${file} ... `)
    try {
      const url = await uploadFile(filePath)
      results[file] = url
      process.stdout.write(`✓\n`)
      ok++
    } catch (e) {
      process.stdout.write(`✗ ${(e as Error).message}\n`)
      fail++
    }
  }

  console.log(`\n✅ ${ok} enviadas  ✗ ${fail} falhas\n`)
  console.log('='.repeat(70))
  console.log('MAPEAMENTO (arquivo → URL Cloudinary):')
  console.log('='.repeat(70))
  for (const [file, url] of Object.entries(results)) {
    console.log(`${file}\n  → ${url}\n`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
