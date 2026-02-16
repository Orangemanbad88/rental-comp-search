/**
 * Raw RETS Client for Paragon/FNI MLS
 * No npm dependencies — uses fetch() only
 */

interface RETSSession {
  sessionCookie: string;
  capabilities: Record<string, string>;
  loginTime: number;
}

interface RETSSearchParams {
  searchType: string;
  class: string;
  query: string;
  select?: string;
  limit?: number;
  offset?: number;
}

interface RETSRecord {
  [key: string]: string;
}

// Session cache — avoids re-login on every request
let cachedSession: RETSSession | null = null;
const SESSION_TTL_MS = 25 * 60 * 1000; // 25 minutes (RETS sessions typically timeout at 30)

function getCredentials() {
  const loginUrl = process.env.RETS_LOGIN_URL;
  const username = process.env.RETS_USERNAME;
  const password = process.env.RETS_PASSWORD;
  const userAgent = process.env.RETS_USER_AGENT || 'CompAtlas/1.0';

  if (!loginUrl || !username || !password) {
    throw new Error('RETS credentials not configured. Set RETS_LOGIN_URL, RETS_USERNAME, RETS_PASSWORD in .env.local');
  }

  return { loginUrl, username, password, userAgent };
}

function basicAuthHeader(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

function isSessionValid(): boolean {
  if (!cachedSession) return false;
  return Date.now() - cachedSession.loginTime < SESSION_TTL_MS;
}

/**
 * Parse RETS login response to extract capability URLs
 * Login response contains key-value pairs like:
 * Search=/rets/fnisrets.aspx/CAPEMAY/search
 * GetObject=/rets/fnisrets.aspx/CAPEMAY/getobject
 */
function parseLoginResponse(body: string, baseUrl: string): Record<string, string> {
  const capabilities: Record<string, string> = {};
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('<') || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    // Make relative URLs absolute
    if (value.startsWith('/')) {
      const url = new URL(baseUrl);
      value = `${url.protocol}//${url.host}${value}`;
    }

    capabilities[key] = value;
  }

  return capabilities;
}

/**
 * Parse COMPACT-DECODED response format
 * Format:
 *   <COLUMNS>\tCol1\tCol2\t...</COLUMNS>
 *   <DATA>\tVal1\tVal2\t...</DATA>
 *   <DATA>\tVal1\tVal2\t...</DATA>
 */
function parseCompactDecoded(body: string): RETSRecord[] {
  const records: RETSRecord[] = [];

  // Extract columns
  const columnsMatch = body.match(/<COLUMNS>\t?([\s\S]*?)<\/COLUMNS>/);
  if (!columnsMatch) {
    console.error('[RETS] No COLUMNS found in response');
    return records;
  }

  const columns = columnsMatch[1].split('\t').filter(c => c.length > 0);

  // Extract data rows
  const dataRegex = /<DATA>\t?([\s\S]*?)<\/DATA>/g;
  let match;

  while ((match = dataRegex.exec(body)) !== null) {
    const values = match[1].split('\t');
    const record: RETSRecord = {};

    for (let i = 0; i < columns.length; i++) {
      record[columns[i]] = values[i] || '';
    }

    records.push(record);
  }

  return records;
}

/**
 * Extract reply code from RETS response
 * <RETS ReplyCode="0" ReplyText="Success">
 */
function parseReplyCode(body: string): { code: number; text: string } {
  const match = body.match(/ReplyCode="(\d+)".*?ReplyText="([^"]*)"/);
  if (!match) return { code: -1, text: 'Could not parse RETS response' };
  return { code: parseInt(match[1], 10), text: match[2] };
}

/**
 * Login to RETS server, cache session
 */
export async function retsLogin(): Promise<RETSSession> {
  if (isSessionValid() && cachedSession) {
    return cachedSession;
  }

  const { loginUrl, username, password, userAgent } = getCredentials();

  console.log(`[RETS] Logging in to ${loginUrl}`);

  const response = await fetch(loginUrl, {
    method: 'GET',
    headers: {
      'Authorization': basicAuthHeader(username, password),
      'User-Agent': userAgent,
      'RETS-Version': 'RETS/1.7.2',
      'Accept': '*/*',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`RETS login failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  const reply = parseReplyCode(body);

  if (reply.code !== 0) {
    throw new Error(`RETS login error: [${reply.code}] ${reply.text}`);
  }

  // Extract session cookie from response headers
  const setCookie = response.headers.get('set-cookie') || '';
  const sessionCookie = setCookie.split(';')[0] || '';

  const capabilities = parseLoginResponse(body, loginUrl);

  console.log('[RETS] Login successful. Capabilities:', Object.keys(capabilities).join(', '));

  cachedSession = {
    sessionCookie,
    capabilities,
    loginTime: Date.now(),
  };

  return cachedSession;
}

/**
 * Search RETS server with DMQL2 query
 */
export async function retsSearch(params: RETSSearchParams): Promise<RETSRecord[]> {
  const session = await retsLogin();
  const { username, password, userAgent } = getCredentials();

  const searchUrl = session.capabilities['Search'];
  if (!searchUrl) {
    throw new Error('RETS Search capability URL not found. Available: ' + Object.keys(session.capabilities).join(', '));
  }

  const searchParams = new URLSearchParams({
    'SearchType': params.searchType,
    'Class': params.class,
    'Query': params.query,
    'QueryType': 'DMQL2',
    'Format': 'COMPACT-DECODED',
    'Limit': String(params.limit || 200),
    'Count': '1',
    'StandardNames': '0',
  });

  if (params.select) {
    searchParams.set('Select', params.select);
  }

  if (params.offset) {
    searchParams.set('Offset', String(params.offset));
  }

  const url = `${searchUrl}?${searchParams.toString()}`;
  console.log(`[RETS] Search: ${params.searchType}/${params.class} | Query: ${params.query}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': basicAuthHeader(username, password),
      'User-Agent': userAgent,
      'RETS-Version': 'RETS/1.7.2',
      'Accept': '*/*',
      ...(session.sessionCookie ? { 'Cookie': session.sessionCookie } : {}),
    },
  });

  if (!response.ok) {
    // If unauthorized, clear session and retry once
    if (response.status === 401) {
      console.log('[RETS] Session expired, re-logging in...');
      cachedSession = null;
      return retsSearch(params);
    }
    throw new Error(`RETS search failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  const reply = parseReplyCode(body);

  // Code 0 = success, Code 20201 = no records found
  if (reply.code !== 0 && reply.code !== 20201) {
    throw new Error(`RETS search error: [${reply.code}] ${reply.text}`);
  }

  if (reply.code === 20201) {
    console.log('[RETS] No records found');
    return [];
  }

  const records = parseCompactDecoded(body);
  console.log(`[RETS] Found ${records.length} records`);

  return records;
}

/**
 * Logout from RETS server
 */
export async function retsLogout(): Promise<void> {
  if (!cachedSession) return;

  const { username, password, userAgent } = getCredentials();
  const logoutUrl = cachedSession.capabilities['Logout'];

  if (logoutUrl) {
    try {
      await fetch(logoutUrl, {
        method: 'GET',
        headers: {
          'Authorization': basicAuthHeader(username, password),
          'User-Agent': userAgent,
          'RETS-Version': 'RETS/1.7.2',
          ...(cachedSession.sessionCookie ? { 'Cookie': cachedSession.sessionCookie } : {}),
        },
      });
      console.log('[RETS] Logged out');
    } catch (e) {
      console.warn('[RETS] Logout error:', e);
    }
  }

  cachedSession = null;
}

/**
 * Fetch a property photo via RETS GetObject
 * Returns binary image data + content type, or null if unavailable
 */
export async function retsGetObject(
  resourceId: string,
  photoIndex: number = 0
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  try {
    const session = await retsLogin();
    const { username, password, userAgent } = getCredentials();

    const getObjectUrl = session.capabilities['GetObject'];
    if (!getObjectUrl) {
      console.warn('[RETS] GetObject capability URL not found');
      return null;
    }

    const params = new URLSearchParams({
      'Type': 'Photo',
      'Resource': 'Property',
      'ID': `${resourceId}:${photoIndex}`,
      'Location': '0',
    });

    const url = `${getObjectUrl}?${params.toString()}`;
    console.log(`[RETS] GetObject: ${resourceId}:${photoIndex}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': basicAuthHeader(username, password),
        'User-Agent': userAgent,
        'RETS-Version': 'RETS/1.7.2',
        'Accept': 'image/*',
        ...(session.sessionCookie ? { 'Cookie': session.sessionCookie } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        cachedSession = null;
        return retsGetObject(resourceId, photoIndex);
      }
      console.warn(`[RETS] GetObject failed: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // RETS may return a text error instead of an image
    if (contentType.startsWith('text/')) {
      console.warn('[RETS] GetObject returned text instead of image');
      return null;
    }

    const data = await response.arrayBuffer();
    if (data.byteLength < 100) {
      console.warn('[RETS] GetObject returned empty/tiny response');
      return null;
    }

    return { data, contentType };
  } catch (error) {
    console.error('[RETS] GetObject error:', error);
    return null;
  }
}

/**
 * Get RETS server metadata (useful for discovering field names)
 */
export async function retsGetMetadata(type: string, id: string): Promise<string> {
  const session = await retsLogin();
  const { username, password, userAgent } = getCredentials();

  const metadataUrl = session.capabilities['GetMetadata'];
  if (!metadataUrl) {
    throw new Error('RETS GetMetadata capability URL not found');
  }

  const params = new URLSearchParams({
    'Type': type,
    'ID': id,
    'Format': 'COMPACT',
  });

  const response = await fetch(`${metadataUrl}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': basicAuthHeader(username, password),
      'User-Agent': userAgent,
      'RETS-Version': 'RETS/1.7.2',
      ...(session.sessionCookie ? { 'Cookie': session.sessionCookie } : {}),
    },
  });

  return response.text();
}
