import { SimpleUserInfo } from './user-info';

export interface AuditAction {
  action: string;
  stepNumber: number;
  nowStep: string;
  activityId?: string | null;
  cosigner?: string[] | null;
  comment?: string | null;
}
