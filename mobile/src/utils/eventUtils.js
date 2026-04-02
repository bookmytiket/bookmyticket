export const parseEventDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    let dt = String(dateStr).trim();
    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (dt.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
      const parts = dt.split(/[-/]/);
      dt = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // If dt already has T or a space + time, don't append default time
    if (dt.includes('T') || dt.includes(' ')) {
      const d = new Date(dt.replace(' ', 'T'));
      return isNaN(d.getTime()) ? null : d;
    }

    let normalizedTime = "23:59";
    if (timeStr) {
      let t = String(timeStr).trim().toUpperCase();
      const ampmMatch = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
      if (ampmMatch) {
        let [_, hours, mins = "00", ampm] = ampmMatch;
        hours = parseInt(hours);
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        normalizedTime = `${String(hours).padStart(2, '0')}:${mins}`;
      } else {
        normalizedTime = t.includes(':') ? t : `${t}:00`;
      }
    }
    
    // Normalizing for comparison logic to allow "today's" events
    const eventDate = new Date(`${dt}T${normalizedTime}`);
    return isNaN(eventDate.getTime()) ? null : eventDate;
  } catch (_) { return null; }
};
