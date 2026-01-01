// src/utils/apiHelper.ts

/**
 * استخراج قائمة من Response API
 * يدعم:
 * 1) { success: true, list: [...] }
 * 2) [...]
 * 3) { data: [...] }
 */
export function extractList<T = any>(response: any): T[] {
  if (!response) return [];

  // axios response
  const data = response.data ?? response;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.list)) return data.list;

  if (Array.isArray(data.data)) return data.data;

  return [];
}
