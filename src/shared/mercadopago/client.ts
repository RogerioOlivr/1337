import { MercadoPagoConfig } from 'mercadopago';

// Singleton — reutiliza a mesma instância entre hot-reloads no dev.
const globalForMp = globalThis as unknown as { mp: MercadoPagoConfig };

export const mp =
  globalForMp.mp ??
  new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForMp.mp = mp;
}
