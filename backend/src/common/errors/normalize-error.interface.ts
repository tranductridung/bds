export interface NormalizedError {
  status: number;
  name: string;
  message: string;
  stack?: string;
}
