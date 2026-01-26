type ResponseType<T> = { data: T; meta?: Record<string, any> };
export class ResponseService {
  /**
   * Format response for endpoint
   * @param data Response data (object or array)
   * @param meta Metadata (pagination, total, page, limit, ...)
   */
  static format<T>(data: T, meta?: Record<string, any>): ResponseType<T> {
    const response: ResponseType<T> = { data };
    if (meta) response.meta = meta;
    return response;
  }
}
