import { authJson } from '../../shared/api/authFetch';
import type { CompanyFiscalStatus, UpdateFiscalBrandingBody, UpdateSarConfigBody } from './fiscal.types';

export function getFiscalCompany() {
  return authJson<CompanyFiscalStatus>('/api/fiscal/company');
}

export function putFiscalSarConfig(body: UpdateSarConfigBody) {
  return authJson<CompanyFiscalStatus>('/api/fiscal/company/sar', { method: 'PUT', json: body });
}

export function putFiscalBranding(body: UpdateFiscalBrandingBody) {
  return authJson<CompanyFiscalStatus>('/api/fiscal/company/branding', { method: 'PUT', json: body });
}

export async function uploadFiscalLogo(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await authJson<{ url: string }>('/api/fiscal/company/logo', { method: 'POST', body: fd });
  return r.url;
}

export function getCompanyBranding() {
  return authJson<{ companyId: number; companyName: string; branding: CompanyFiscalStatus['branding'] }>('/api/fiscal/company/branding');
}
