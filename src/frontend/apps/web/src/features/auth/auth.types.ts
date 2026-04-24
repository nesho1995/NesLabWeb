export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

export type CurrentUserResponse = {
  userId: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};
