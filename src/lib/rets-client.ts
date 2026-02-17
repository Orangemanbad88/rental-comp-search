/**
 * RETS Client for Paragon/FNI MLS — ported from comp-search
 * Per-request login/search/logout cycle (stateless, reliable)
 * Uses fetch() only — no npm dependencies
 */

export interface RetsConfig {
  loginUrl: string;
  username: string;
  password: string;
  userAgent?: string;
}

interface CapabilityUrls {
  search: string;
  getObject: string;
  logout: string;
}

/** Get RETS config from environment variables */
export function getRetsConfig(): RetsConfig {
  const loginUrl = process.env.RETS_LOGIN_URL;
  const username = process.env.RETS_USERNAME;
  const password = process.env.RETS_PASSWORD;
  const userAgent = process.env.RETS_USER_AGENT || 'RentAtlas/1.0';

  if (!loginUrl || !username || !password) {
    throw new Error(
      'RETS credentials not configured. Set RETS_LOGIN_URL, RETS_USERNAME, RETS_PASSWORD in .env.local'
    );
  }

  return { loginUrl, username, password, userAgent };
}

/** Check if RETS credentials are configured */
export function hasRetsConfig(): boolean {
  return !!(process.env.RETS_LOGIN_URL && process.env.RETS_USERNAME && process.env.RETS_PASSWORD);
}

// ---------------------------------------------------------------------------
// XML / response parsers
// ---------------------------------------------------------------------------

/** Extract capability URLs from RETS login response */
function parseLoginResponse(xml: string, baseUrl: string): CapabilityUrls {
  const base = new URL(baseUrl);

  const extract = (key: string): string => {
    const re = new RegExp(`${key}\\s*=\\s*(.+)`, 'i');
    const m = xml.match(re);
    if (!m) return '';
    const value = m[1].trim();
    if (value.startsWith('http')) return value;
    return `${base.origin}${value}`;
  };

  return {
    search: extract('Search'),
    getObject: extract('GetObject'),
    logout: extract('Logout'),
  };
}

/**
 * Parse COMPACT-DECODED RETS response into records
 *
 * Format:
 *   <DELIMITER value="09"/>
 *   <COLUMNS>\tField1\tField2\t</COLUMNS>
 *   <DATA>\tVal1\tVal2\t</DATA>
 */
function parseCompactDecoded(text: string): Record<string, string>[] {
  const delimMatch = text.match(/<DELIMITER\s+value\s*=\s*"([^"]+)"/i);
  const delim = delimMatch ? String.fromCharCode(parseInt(delimMatch[1], 16)) : '\t';

  const colMatch = text.match(/<COLUMNS>([\s\S]*?)<\/COLUMNS>/i);
  if (!colMatch) return [];
  const columns = colMatch[1].split(delim).filter(Boolean);

  const rows: Record<string, string>[] = [];
  const dataRe = /<DATA>([\s\S]*?)<\/DATA>/gi;
  let m: RegExpExecArray | null;
  while ((m = dataRe.exec(text)) !== null) {
    const values = m[1].split(delim);
    if (values.length > 0 && values[0] === '') values.shift();
    if (values.length > 0 && values[values.length - 1] === '') values.pop();

    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = values[i] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Photo fetching
// ---------------------------------------------------------------------------

/**
 * Fetch a property photo via RETS GetObject (per-request login cycle)
 */
export async function retsGetObject(
  listingId: string,
  photoIdx = 0,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const config = getRetsConfig();
  const authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
    'User-Agent': config.userAgent || 'RentAtlas/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  let capabilities: CapabilityUrls | null = null;
  let sessionCookies = '';

  try {
    // --- LOGIN ---
    const loginRes = await fetch(config.loginUrl, { headers: baseHeaders, redirect: 'manual' });
    if (!loginRes.ok && loginRes.status !== 302) {
      throw new Error(`RETS login failed: ${loginRes.status}`);
    }
    const loginBody = await loginRes.text();

    const setCookies = loginRes.headers.getSetCookie?.() || [];
    sessionCookies = setCookies.map((c: string) => c.split(';')[0]).join('; ');

    const replyCodeMatch = loginBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (replyCodeMatch && replyCodeMatch[1] !== '0') {
      return null;
    }

    capabilities = parseLoginResponse(loginBody, config.loginUrl);
    if (!capabilities.getObject) return null;

    // --- GET OBJECT ---
    const objectParams = new URLSearchParams({
      Type: 'Photo',
      Resource: 'Property',
      ID: `${listingId}:${photoIdx}`,
    });

    const objectHeaders = { ...baseHeaders };
    if (sessionCookies) objectHeaders['Cookie'] = sessionCookies;

    const objectUrl = `${capabilities.getObject}?${objectParams.toString()}`;
    const objectRes = await fetch(objectUrl, { headers: objectHeaders });

    if (!objectRes.ok) return null;

    const contentType = objectRes.headers.get('content-type') || 'image/jpeg';
    if (contentType.includes('text/xml') || contentType.includes('text/html')) {
      return null;
    }

    const data = await objectRes.arrayBuffer();
    if (data.byteLength < 100) return null;

    return { data, contentType };
  } catch (error) {
    console.error('[RETS] GetObject error:', error);
    return null;
  } finally {
    if (capabilities?.logout) {
      const logoutHeaders = { ...baseHeaders };
      if (sessionCookies) logoutHeaders['Cookie'] = sessionCookies;
      fetch(capabilities.logout, { headers: logoutHeaders }).catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Per-request RETS login → search → logout cycle
 */
export async function retsSearch(
  resource: string,
  className: string,
  query: string,
  selectFields?: string[],
  limit = 50,
): Promise<Record<string, string>[]> {
  const config = getRetsConfig();
  const authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
    'User-Agent': config.userAgent || 'RentAtlas/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  let capabilities: CapabilityUrls | null = null;
  let sessionCookies = '';

  try {
    // --- LOGIN ---
    const loginRes = await fetch(config.loginUrl, { headers: baseHeaders, redirect: 'manual' });
    if (!loginRes.ok && loginRes.status !== 302) {
      throw new Error(`RETS login failed: ${loginRes.status} ${loginRes.statusText}`);
    }
    const loginBody = await loginRes.text();

    const setCookies = loginRes.headers.getSetCookie?.() || [];
    sessionCookies = setCookies.map((c: string) => c.split(';')[0]).join('; ');

    const replyCodeMatch = loginBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (replyCodeMatch && replyCodeMatch[1] !== '0') {
      const replyText = loginBody.match(/ReplyText\s*=\s*"([^"]+)"/i);
      throw new Error(`RETS login error ${replyCodeMatch[1]}: ${replyText?.[1] || 'Unknown'}`);
    }

    capabilities = parseLoginResponse(loginBody, config.loginUrl);
    if (!capabilities.search) {
      throw new Error('RETS login succeeded but no Search capability URL found');
    }

    // --- SEARCH ---
    const searchParams = new URLSearchParams({
      SearchType: resource,
      Class: className,
      Query: query,
      QueryType: 'DMQL2',
      Format: 'COMPACT-DECODED',
      Limit: String(limit),
      Count: '1',
      StandardNames: '0',
    });

    if (selectFields?.length) {
      searchParams.set('Select', selectFields.join(','));
    }

    const searchHeaders = { ...baseHeaders };
    if (sessionCookies) searchHeaders['Cookie'] = sessionCookies;

    const searchUrl = `${capabilities.search}?${searchParams.toString()}`;
    console.log(`[RETS] Search: ${resource}/${className}`);

    const searchRes = await fetch(searchUrl, { headers: searchHeaders });
    if (!searchRes.ok) {
      throw new Error(`RETS search failed: ${searchRes.status} ${searchRes.statusText}`);
    }

    const searchBody = await searchRes.text();

    const searchReplyMatch = searchBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (searchReplyMatch && searchReplyMatch[1] !== '0') {
      if (searchReplyMatch[1] === '20201') {
        console.log('[RETS] No records found');
        return [];
      }
      const searchReplyText = searchBody.match(/ReplyText\s*=\s*"([^"]+)"/i);
      throw new Error(`RETS search error ${searchReplyMatch[1]}: ${searchReplyText?.[1] || 'Unknown'}`);
    }

    const records = parseCompactDecoded(searchBody);
    console.log(`[RETS] Found ${records.length} records`);
    return records;
  } finally {
    if (capabilities?.logout) {
      const logoutHeaders = { ...baseHeaders };
      if (sessionCookies) logoutHeaders['Cookie'] = sessionCookies;
      fetch(capabilities.logout, { headers: logoutHeaders }).catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/**
 * Fetch RETS metadata to discover available resources/classes
 */
export async function retsGetMetadata(type: string, id: string): Promise<string> {
  const config = getRetsConfig();
  const authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
    'User-Agent': config.userAgent || 'RentAtlas/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  let capabilities: CapabilityUrls | null = null;
  let sessionCookies = '';

  try {
    const loginRes = await fetch(config.loginUrl, { headers: baseHeaders, redirect: 'manual' });
    if (!loginRes.ok && loginRes.status !== 302) {
      throw new Error(`RETS login failed: ${loginRes.status}`);
    }
    const loginBody = await loginRes.text();

    const setCookies = loginRes.headers.getSetCookie?.() || [];
    sessionCookies = setCookies.map((c: string) => c.split(';')[0]).join('; ');

    capabilities = parseLoginResponse(loginBody, config.loginUrl);
    const getMetadataUrl = capabilities.search?.replace(/search/i, 'getmetadata') || '';

    if (!getMetadataUrl) {
      // Try extracting GetMetadata capability directly
      const metaExtract = loginBody.match(/GetMetadata\s*=\s*(.+)/i);
      if (!metaExtract) throw new Error('GetMetadata capability not found');
      const metaUrl = metaExtract[1].trim().startsWith('http')
        ? metaExtract[1].trim()
        : `${new URL(config.loginUrl).origin}${metaExtract[1].trim()}`;

      const params = new URLSearchParams({ Type: type, ID: id, Format: 'COMPACT' });
      const metaHeaders = { ...baseHeaders };
      if (sessionCookies) metaHeaders['Cookie'] = sessionCookies;
      const res = await fetch(`${metaUrl}?${params}`, { headers: metaHeaders });
      return res.text();
    }

    const params = new URLSearchParams({ Type: type, ID: id, Format: 'COMPACT' });
    const metaHeaders = { ...baseHeaders };
    if (sessionCookies) metaHeaders['Cookie'] = sessionCookies;
    const res = await fetch(`${getMetadataUrl}?${params}`, { headers: metaHeaders });
    return res.text();
  } finally {
    if (capabilities?.logout) {
      const logoutHeaders = { ...baseHeaders };
      if (sessionCookies) logoutHeaders['Cookie'] = sessionCookies;
      fetch(capabilities.logout, { headers: logoutHeaders }).catch(() => {});
    }
  }
}
