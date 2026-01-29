export interface IJwtPayload {
  sub: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  iat?: number;
  exp?: number;
}
