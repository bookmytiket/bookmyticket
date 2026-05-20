import { supabase } from './supabase';

/**
 * Helper to detect OS/Browser from User Agent.
 */
function getDeviceInfo() {
    if (typeof window === 'undefined') return { os: 'Server', browser: 'Server', width: 0, height: 0 };
    
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    
    if (/android/i.test(ua)) os = 'Android';
    else if (/ipad|iphone|ipod/i.test(ua)) os = 'iOS';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    
    if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/msie|trident/i.test(ua)) browser = 'IE';
    else if (/edg/i.test(ua)) browser = 'Edge';
    
    return {
        os,
        browser,
        width: window.innerWidth,
        height: window.innerHeight,
        deviceType: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
    };
}

/**
 * Logs or upserts the active user's device info.
 */
export async function trackUserDevice(userId) {
    try {
        if (!userId || typeof window === 'undefined') return;
        const info = getDeviceInfo();
        
        // Check if user_devices table is queryable/insertable
        const payload = {
            user_id: userId,
            device_type: info.deviceType,
            os: info.os,
            browser: info.browser,
            screen_width: info.width,
            screen_height: info.height,
            last_seen: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_devices')
            .upsert(payload, { onConflict: 'user_id,os,browser' });
            
        if (error) {
            console.warn('[mobileTracking] user_devices upsert fell back to insert:', error.message);
            // Non-destructive fallback insert
            await supabase.from('user_devices').insert(payload);
        }
    } catch (err) {
        console.error('[mobileTracking] trackUserDevice failed:', err.message);
    }
}

/**
 * Gets the user's dashboard view preferences.
 */
export async function getDashboardPreferences(userId) {
    try {
        if (!userId) return null;
        const { data, error } = await supabase
            .from('user_dashboard_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
        if (error) throw error;
        return data;
    } catch (err) {
        console.warn('[mobileTracking] getDashboardPreferences failed:', err.message);
        return null;
    }
}

/**
 * Saves or updates dashboard preferences.
 */
export async function saveDashboardPreferences(userId, prefs) {
    try {
        if (!userId) return;
        const payload = {
            user_id: userId,
            default_tab: prefs.defaultTab || 'my_booking',
            ticket_view_mode: prefs.ticketViewMode || 'mobile',
            invoice_view_mode: prefs.invoiceViewMode || 'mobile'
        };
        
        const { error } = await supabase
            .from('user_dashboard_preferences')
            .upsert(payload, { onConflict: 'user_id' });
            
        if (error) {
            console.warn('[mobileTracking] user_dashboard_preferences fell back to insert:', error.message);
            await supabase.from('user_dashboard_preferences').insert(payload);
        }
    } catch (err) {
        console.error('[mobileTracking] saveDashboardPreferences failed:', err.message);
    }
}

/**
 * Saves ticket digital asset paths.
 */
export async function saveTicketAssets(bookingId, assets) {
    try {
        if (!bookingId) return;
        const payload = {
            booking_id: bookingId,
            mobile_ticket_url: assets.mobileTicketUrl || '',
            desktop_ticket_url: assets.desktopTicketUrl || '',
            invoice_url: assets.invoiceUrl || '',
            qr_token: assets.qrToken || ''
        };
        
        const { error } = await supabase
            .from('ticket_assets')
            .upsert(payload, { onConflict: 'booking_id' });
            
        if (error) {
            console.warn('[mobileTracking] ticket_assets fell back to insert:', error.message);
            await supabase.from('ticket_assets').insert(payload);
        }
    } catch (err) {
        console.error('[mobileTracking] saveTicketAssets failed:', err.message);
    }
}

/**
 * Logs visual layout and hydration anomalies for production analysis.
 */
export async function logUiError(userId, screenName, errorType, errorPayload) {
    try {
        const info = typeof window !== 'undefined' ? getDeviceInfo() : {};
        const payload = {
            user_id: userId || null,
            screen_name: screenName,
            device_info: info,
            error_type: errorType,
            payload: errorPayload || {},
            created_at: new Date().toISOString()
        };
        
        await supabase.from('ui_error_logs').insert(payload);
    } catch (err) {
        console.error('[mobileTracking] logUiError failed:', err.message);
    }
}
