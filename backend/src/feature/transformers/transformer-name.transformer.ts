import { normalizeFeatureName } from '../helpers/normalize-name.helper';

export class NormalizeTransformer {
  to(data?: string | null): string | null {
    if (!data) return null;

    return normalizeFeatureName(data);
  }

  from(data: string | null): string | null {
    return data;
  }
}
