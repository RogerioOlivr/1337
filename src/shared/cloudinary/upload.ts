import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Faz upload de um arquivo para o Cloudinary.
 * @param file  Arquivo recebido via FormData (File/Blob)
 * @param folder Pasta dentro do Cloudinary (ex: "produtos")
 * @returns URL segura da imagem hospedada
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'produtos'
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          // Transformações automáticas: converte para WebP, limita a 1200px
          transformation: [{ width: 1200, crop: 'limit', fetch_format: 'webp', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload falhou'))
          resolve(result.secure_url)
        }
      )
      .end(buffer)
  })
}
