import { NextRequest, NextResponse } from 'next/server';

interface TestRequest {
  provider: string;
  credentials: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const body: TestRequest = await req.json();
    const { provider, credentials } = body;

    if (!provider || !credentials) {
      return NextResponse.json(
        { success: false, message: 'Missing provider or credentials' },
        { status: 400 }
      );
    }

    switch (provider) {
      case 'simplyrets': {
        const { username, password } = credentials;
        if (!username || !password) {
          return NextResponse.json({ success: false, message: 'Username and password are required' });
        }
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');
        const res = await fetch('https://api.simplyrets.com/properties?limit=1', {
          headers: { Authorization: `Basic ${authHeader}` },
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Connected to SimplyRETS successfully' });
        }
        return NextResponse.json({
          success: false,
          message: `SimplyRETS returned ${res.status}: ${res.statusText}`,
        });
      }

      case 'bridgeinteractive': {
        const { apiKey, serverUrl } = credentials;
        if (!apiKey || !serverUrl) {
          return NextResponse.json({ success: false, message: 'API key and server URL are required' });
        }
        const res = await fetch(`${serverUrl}/api/v2/OData/Property?$top=1`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Connected to Bridge Interactive successfully' });
        }
        return NextResponse.json({
          success: false,
          message: `Bridge returned ${res.status}: ${res.statusText}`,
        });
      }

      case 'sparkapi': {
        const { apiKey } = credentials;
        if (!apiKey) {
          return NextResponse.json({ success: false, message: 'API key is required' });
        }
        const res = await fetch('https://sparkapi.com/v1/listings?_limit=1', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Connected to Spark API successfully' });
        }
        return NextResponse.json({
          success: false,
          message: `Spark API returned ${res.status}: ${res.statusText}`,
        });
      }

      case 'crmls': {
        const { loginUrl, username, password } = credentials;
        if (!loginUrl || !username || !password) {
          return NextResponse.json({ success: false, message: 'Login URL, username, and password are required' });
        }
        const res = await fetch(loginUrl, {
          method: 'HEAD',
          headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` },
        });
        if (res.ok || res.status === 401) {
          return NextResponse.json({
            success: res.ok,
            message: res.ok
              ? 'Connected to CRMLS successfully'
              : 'CRMLS server reachable but credentials were rejected',
          });
        }
        return NextResponse.json({
          success: false,
          message: `CRMLS returned ${res.status}: ${res.statusText}`,
        });
      }

      case 'custom': {
        const { baseUrl, apiKey } = credentials;
        if (!baseUrl || !apiKey) {
          return NextResponse.json({ success: false, message: 'Base URL and API key are required' });
        }
        const res = await fetch(baseUrl, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Connected to custom endpoint successfully' });
        }
        return NextResponse.json({
          success: false,
          message: `Endpoint returned ${res.status}: ${res.statusText}`,
        });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown provider: ${provider}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: `Connection test failed: ${message}` },
      { status: 500 }
    );
  }
}
