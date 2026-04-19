import { NextResponse } from 'next/server';
import { deleteFromAuditCache, clearAuditCache } from '@/lib/cache-db';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, appName, permissions } = body;

  if (action === 'delete') {
    if (!appName) {
      return NextResponse.json({ error: 'appName is required for delete action.' }, { status: 400 });
    }

    const deleted = deleteFromAuditCache(appName, permissions);
    return NextResponse.json({ success: deleted, deletedByApp: !permissions, appName });
  }

  if (action === 'clear') {
    const cleared = clearAuditCache();
    return NextResponse.json({ success: cleared });
  }

  return NextResponse.json({ error: 'Unsupported action. Use "delete" or "clear".' }, { status: 400 });
}
