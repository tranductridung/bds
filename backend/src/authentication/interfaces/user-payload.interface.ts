export interface UserPayload {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  isSystem: boolean;
}
