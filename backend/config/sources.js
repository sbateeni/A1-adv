export const OFFICIAL_PALESTINIAN_DOMAINS = [
  'birzeit.edu',
  'dftp.gov.ps',
  'courts.gov.ps',
  'moj.pna.ps',
  'pgp.ps',
  'palestinebar.ps',
  'maqam.najah.edu',
  'darifta.ps',
  'qou.edu',
  '.ps'
];

export const BLACKLISTED_DOMAINS = [
  '.jo',
  '.eg',
  '.qa',
  '.sa',
  'aliftaa.jo',
  'islamweb.net',
  'islamway.net',
  'mawdoo3.com',
  'wikipedia.org'
];

export function sourcePriority(hostname) {
  const host = (hostname || '').toLowerCase();
  if (host.includes('birzeit.edu')) return 1;
  if (host.includes('dftp.gov.ps')) return 2;
  if (host.includes('courts.gov.ps')) return 3;
  if (host.includes('moj.pna.ps')) return 4;
  return 10;
}
