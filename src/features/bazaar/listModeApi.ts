import { supabase } from '@/lib/supabase';
import type { BazaarSettings } from '@/types/bazaar';

/** One transaction: choose or create General, then switch this account's home. */
export async function setListMode(enabled: boolean, name: string, settings: BazaarSettings): Promise<string | null> {
  const { data, error } = await supabase.rpc('bazaar_set_list_mode', {
    p_enabled: enabled,
    p_name: name,
    p_app_lang: settings.appLang,
    p_product_lang: settings.productLang,
  });
  if (error) throw error;
  return data as string | null;
}
