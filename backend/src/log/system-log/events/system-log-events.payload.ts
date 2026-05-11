import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '../../enums/system-log.enum';

export interface ListenerSystemLogPayload {
  path?: string;
  method?: string;
  statusCode?: number;
  actorType: SystemLogActorType;
  action: SystemLogAction;
  actorId?: number;
  targetType?: SystemLogTargetType;
  targetId?: string;
  meta?: Record<string, any>;
}
