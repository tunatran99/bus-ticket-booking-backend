export interface User {
  userId: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  role: string;
  createdAt: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
