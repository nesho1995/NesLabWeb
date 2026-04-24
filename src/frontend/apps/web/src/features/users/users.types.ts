export type UserListItem = {
  id: number;
  username: string;
  fullName: string;
  isActive: boolean;
  roleIds: number[];
  roleCodes: string[];
};

export type RoleListItem = {
  id: number;
  code: string;
  name: string;
};

export type CreateUserBody = {
  username: string;
  fullName: string;
  password: string;
  roleIds: number[];
};

export type UpdateUserBody = {
  fullName: string;
  isActive: boolean;
  roleIds: number[];
};

export type SetPasswordBody = { newPassword: string };
