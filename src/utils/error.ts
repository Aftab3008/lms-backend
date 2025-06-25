export class AppError extends Error {
  public statusCode: number;
  public success: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    Error.captureStackTrace(this, this.constructor);
  }
}
