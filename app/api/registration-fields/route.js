import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/registration-fields
 * Called by the Organiser Panel when a new field is added.
 * Persists the field to `registration_fields` table AND
 * updates `dynamic_config.form_fields` in the events table.
 *
 * Body: { eventId, field: { label, type, options?, required, sort_order? } }
 */
export async function POST(request) {
    try {
        const { eventId, field } = await request.json();

        if (!eventId || !field?.label) {
            return NextResponse.json({ error: 'eventId and field.label are required' }, { status: 400 });
        }

        const fieldKey = field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const fieldId = field.id || Date.now();

        // 1. Upsert into registration_fields table
        const { data: rfData, error: rfError } = await supabase
            .from('registration_fields')
            .upsert({
                event_id:   eventId,
                field_key:  fieldKey,
                label:      field.label,
                field_type: field.type || 'text',
                options:    field.options ? (Array.isArray(field.options) ? field.options : field.options.split(',').map(s => s.trim())) : null,
                is_required: !!field.required,
                sort_order: field.sort_order || 0,
                is_active:  true,
            }, { onConflict: 'event_id,field_key' })
            .select()
            .single();

        if (rfError) {
            console.error('[registration-fields] DB upsert error:', rfError);
            // Don't fail — still try to update dynamic_config below
        }

        // 2. Update dynamic_config.form_fields in events table
        const { data: eventData, error: fetchError } = await supabase
            .from('events')
            .select('dynamic_config')
            .eq('id', eventId)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: 'Event not found', details: fetchError.message }, { status: 404 });
        }

        const cfg = typeof eventData.dynamic_config === 'string'
            ? JSON.parse(eventData.dynamic_config)
            : (eventData.dynamic_config || {});

        const existingFields = Array.isArray(cfg.form_fields) ? cfg.form_fields : [];

        // Check if field already exists (by label or id)
        const existingIdx = existingFields.findIndex(f =>
            String(f.id) === String(fieldId) ||
            f.label?.toLowerCase() === field.label?.toLowerCase()
        );

        const newField = {
            id:       fieldId,
            type:     field.type || 'text',
            label:    field.label,
            required: !!field.required,
            ...(field.options ? {
                options: Array.isArray(field.options)
                    ? field.options
                    : field.options.split(',').map(s => s.trim())
            } : {})
        };

        let updatedFields;
        if (existingIdx >= 0) {
            // Update existing
            updatedFields = existingFields.map((f, i) => i === existingIdx ? { ...f, ...newField } : f);
        } else {
            // Append new
            updatedFields = [...existingFields, newField];
        }

        const { error: updateError } = await supabase
            .from('events')
            .update({ dynamic_config: { ...cfg, form_fields: updatedFields } })
            .eq('id', eventId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update event config', details: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            field:   newField,
            allFields: updatedFields,
            dbRecord: rfData || null
        });

    } catch (err) {
        console.error('[registration-fields] Unexpected error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/registration-fields
 * Remove a field from both tables.
 * Body: { eventId, fieldLabel }
 */
export async function DELETE(request) {
    try {
        const { eventId, fieldLabel } = await request.json();
        if (!eventId || !fieldLabel) {
            return NextResponse.json({ error: 'eventId and fieldLabel required' }, { status: 400 });
        }

        const fieldKey = fieldLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        // 1. Soft-delete from registration_fields
        await supabase
            .from('registration_fields')
            .update({ is_active: false })
            .eq('event_id', eventId)
            .eq('field_key', fieldKey);

        // 2. Remove from dynamic_config.form_fields
        const { data: eventData } = await supabase
            .from('events')
            .select('dynamic_config')
            .eq('id', eventId)
            .single();

        if (eventData) {
            const cfg = typeof eventData.dynamic_config === 'string'
                ? JSON.parse(eventData.dynamic_config)
                : (eventData.dynamic_config || {});

            const updatedFields = (cfg.form_fields || []).filter(
                f => f.label?.toLowerCase() !== fieldLabel.toLowerCase()
            );

            await supabase
                .from('events')
                .update({ dynamic_config: { ...cfg, form_fields: updatedFields } })
                .eq('id', eventId);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/registration-fields?eventId=xxx
 * Fetch all active fields for an event.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

    const { data, error } = await supabase
        .from('registration_fields')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        // Fallback to dynamic_config if table doesn't exist yet
        const { data: ev } = await supabase
            .from('events')
            .select('dynamic_config')
            .eq('id', eventId)
            .single();
        const cfg = typeof ev?.dynamic_config === 'string' ? JSON.parse(ev.dynamic_config) : (ev?.dynamic_config || {});
        return NextResponse.json({ fields: cfg.form_fields || [], source: 'dynamic_config' });
    }

    return NextResponse.json({ fields: data, source: 'registration_fields' });
}
