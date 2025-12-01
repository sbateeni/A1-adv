export const OFFICIAL_PALESTINIAN_DOMAINS = [
  'site:birzeit.edu',
  'site:dftp.gov.ps',
  'site:courts.gov.ps',
  'site:moj.pna.ps',
  'site:pgp.ps',
  'site:palestinebar.ps',
  'site:maqam.najah.edu',
  'site:darifta.ps',
  'site:qou.edu'
];

export function buildOfficialSiteFilter() {
  return `(${OFFICIAL_PALESTINIAN_DOMAINS.join(' OR ')})`;
}

export function sourcePriority(hostname: string) {
  const host = (hostname || '').toLowerCase();
  if (host.includes('birzeit.edu')) return 1;
  if (host.includes('dftp.gov.ps')) return 2;
  if (host.includes('courts.gov.ps')) return 3;
  if (host.includes('moj.pna.ps')) return 4;
  return 10;
}

export function getHost(url: string) {
  try { return new URL(url).hostname; } catch { return ''; }
}
