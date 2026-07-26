import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super({ message, code, details }, status);
    this.code = code;
    this.details = details;
  }
}
