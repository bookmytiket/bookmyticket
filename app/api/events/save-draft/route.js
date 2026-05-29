import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();
    const { event_id, payload, draft_data, organiser_id } = body;

    if (!organiser_id) {
      return NextResponse.json({ error: 'Organiser ID required' }, { status: 400 });
    }

    // 1. Upsert event into events table with status 'draft'
    let eventId = event_id;
    const eventPayload = {
      ...payload,
      status: 'draft',
      publish_status: 'unpublished',
      organiser_id
    };

    if (eventId) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventPayload)
        .eq('id', eventId)
        .eq('organiser_id', organiser_id);
      
      if (updateError) throw updateError;
    } else {
      const { data: newEvent, error: insertError } = await supabase
        .from('events')
        .insert(eventPayload)
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      eventId = newEvent.id;
    }

    // 2. Save draft data
    if (draft_data) {
      const { data: existingDraft } = await supabase
        .from('event_drafts')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingDraft) {
        await supabase
          .from('event_drafts')
          .update({ draft_json: draft_data, last_saved_at: new Date().toISOString() })
          .eq('id', existingDraft.id);
      } else {
        await supabase
          .from('event_drafts')
          .insert({ event_id: eventId, draft_json: draft_data });
      }
    }

    return NextResponse.json({ success: true, event_id: eventId });
  } catch (error) {
    console.error('Error in save-draft:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
