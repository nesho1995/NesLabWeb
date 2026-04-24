import { authJson } from '../../shared/api/authFetch';
import type { CompanyCashSettings, UpdateCompanyCashSettingsPayload } from './companyCash.types';

export function getCompanyCashSettings() {
  return authJson<CompanyCashSettings>('/api/company/cash-settings');
}

export function putCompanyCashSettings(body: UpdateCompanyCashSettingsPayload) {
  return authJson<CompanyCashSettings>('/api/company/cash-settings', { method: 'PUT', json: body });
}
