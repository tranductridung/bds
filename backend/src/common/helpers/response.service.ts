export class ResponseService {
  /**
   * Format response for endpoint
   * @param data Response data (object or array)
   * @param meta Metadata (pagination, total, page, limit, ...)
   */
  static format<T>(
    data: T,
    meta?: Record<string, any>,
  ): { data: T; meta?: Record<string, any> } {
    const response: { data: T; meta?: Record<string, any> } = { data };
    if (meta) response.meta = meta;
    return response;
  }
}
