export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export enum BizCode {
  OK = 0,
  BadRequest = 40000,
  Unauthorized = 40100,
  Forbidden = 40300,
  NotFound = 40400,
  Conflict = 40900,
  InvalidParams = 42200,
  RateLimited = 42900,
  ServerError = 50000,
}
