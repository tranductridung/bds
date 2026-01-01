import { ActivityValue } from '@/src/lead/types/activity-json.type';

export interface AuditPayload {
  targetId: number;
  description?: string;
  oldValue?: ActivityValue;
  newValue?: ActivityValue;
}
