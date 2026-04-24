import { authJson } from '../../shared/api/authFetch';
import type { CreateUserBody, RoleListItem, SetPasswordBody, UpdateUserBody, UserListItem } from './users.types';

export function getUsers() {
  return authJson<UserListItem[]>('/api/users');
}

export function getRoles() {
  return authJson<RoleListItem[]>('/api/roles');
}

export function createUser(body: CreateUserBody) {
  return authJson<UserListItem>('/api/users', { method: 'POST', json: body });
}

export function updateUser(id: number, body: UpdateUserBody) {
  return authJson<UserListItem>(`/api/users/${id}`, { method: 'PUT', json: body });
}

export function setUserPassword(id: number, body: SetPasswordBody) {
  return authJson<void>(`/api/users/${id}/password`, { method: 'PUT', json: body });
}
