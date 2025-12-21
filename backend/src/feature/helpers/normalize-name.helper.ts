import { BadRequestException } from '@nestjs/common';

export function normalizeFeatureName(data: string): string {
  if (!data || !data.trim()) {
    throw new BadRequestException('Feature name is required');
  }

  return data.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}
