export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }

  from(data: string | null): number {
    return data !== null ? parseFloat(data) : 0;
  }
}
