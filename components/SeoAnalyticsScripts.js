import { supabase } from "@/lib/supabase";
import SeoAnalyticsScriptsClient from "./SeoAnalyticsScriptsClient";

async function getSeoConfig() {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'seo_analytics')
      .single();
    
    return data?.value || { ga_id: "G-XXXXXXXXXX", ga_enabled: false };
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return { ga_id: "G-XXXXXXXXXX", ga_enabled: false };
  }
}

export default async function SeoAnalyticsScripts() {
  const config = await getSeoConfig();

  return (
    <SeoAnalyticsScriptsClient 
      gaId={config.ga_id}
      gaEnabled={config.ga_enabled}
      customScripts={config.meta_ads_code}
    />
  );
}
