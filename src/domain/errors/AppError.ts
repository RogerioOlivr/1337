export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    // Necessário para instanceof funcionar corretamente com herança em TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
