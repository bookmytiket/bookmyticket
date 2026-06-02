import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/marathon/documents
 * Upload identity verification document URL.
 *
 * Body: { registration_id (UUID or BMT-MR-xxx), document_type, document_url }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userId = user.id;
    }

    const { registration_id: regParam, document_type, document_url } = await request.json();

    const VALID_DOC_TYPES = ['Aadhaar', 'Passport', 'Driving License', 'School ID', 'College ID'];
    if (!VALID_DOC_TYPES.includes(document_type)) {
      return NextResponse.json({ error: `document_type must be one of: ${VALID_DOC_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!document_url) {
      return NextResponse.json({ error: 'document_url is required' }, { status: 400 });
    }
    if (!regParam) {
      return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });
    }

    // Resolve registration UUID
    const isUuid = /^[0-9a-f-]{36}$/i.test(regParam);
    let registrationUuid = isUuid ? regParam : null;

    if (!registrationUuid) {
      const { data: reg } = await adminClient
        .from('marathon_registrations')
        .select('id')
        .eq('registration_id', regParam)
        .maybeSingle();
      registrationUuid = reg?.id;
    }

    if (!registrationUuid) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Upsert (replace existing doc of same type)
    const { data: doc, error: docErr } = await adminClient
      .from('marathon_documents')
      .upsert({
        registration_id: registrationUuid,
        document_type,
        document_url,
        verification_status: 'Pending',
      }, { onConflict: 'registration_id, document_type' })
      .select()
      .single();

    if (docErr) {
      // If upsert fails due to no unique constraint, do insert
      const { data: inserted, error: insErr } = await adminClient
        .from('marathon_documents')
        .insert({ registration_id: registrationUuid, document_type, document_url, verification_status: 'Pending' })
        .select()
        .single();
      if (insErr) throw insErr;
      return NextResponse.json({ success: true, document: inserted });
    }

    return NextResponse.json({ success: true, document: doc });

  } catch (err) {
    console.error('[/api/marathon/documents] POST Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/marathon/documents
 * Admin/Organiser: approve or reject a document.
 *
 * Body: { document_id, verification_status: 'Approved' | 'Rejected', rejection_reason }
 */
export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin or organiser role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'organiser'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { document_id, verification_status, rejection_reason } = await request.json();

    if (!['Approved', 'Rejected'].includes(verification_status)) {
      return NextResponse.json({ error: 'verification_status must be Approved or Rejected' }, { status: 400 });
    }

    const { data: updated, error: updErr } = await adminClient
      .from('marathon_documents')
      .update({
        verification_status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejection_reason || null,
      })
      .eq('id', document_id)
      .select()
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({ success: true, document: updated });

  } catch (err) {
    console.error('[/api/marathon/documents] PATCH Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/marathon/documents?registration_id=xxx OR ?marathon_id=xxx
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const registrationParam = searchParams.get('registration_id');
  const marathonId = searchParams.get('marathon_id');

  try {
    if (registrationParam) {
      const isUuid = /^[0-9a-f-]{36}$/i.test(registrationParam);
      let regUuid = isUuid ? registrationParam : null;

      if (!regUuid) {
        const { data: reg } = await adminClient
          .from('marathon_registrations')
          .select('id')
          .eq('registration_id', registrationParam)
          .maybeSingle();
        regUuid = reg?.id;
      }

      const { data: docs, error } = await adminClient
        .from('marathon_documents')
        .select('*')
        .eq('registration_id', regUuid);

      if (error) throw error;
      return NextResponse.json({ success: true, documents: docs || [] });
    }

    if (marathonId) {
      // Get all documents for a marathon (organiser view)
      const { data: docs, error } = await adminClient
        .from('marathon_documents')
        .select(`
          *,
          marathon_registrations!inner (
            registration_id, participant_name, marathon_id
          )
        `)
        .eq('marathon_registrations.marathon_id', marathonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, documents: docs || [] });
    }

    return NextResponse.json({ error: 'registration_id or marathon_id required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
