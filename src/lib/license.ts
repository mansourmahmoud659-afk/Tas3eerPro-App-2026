const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// قائمة الأكواد المباشرة للتفعيل السريع
const HARDCODED_LICENSES = [
  "TAS3EER-PRO-8K92-X101",
  "TAS3EER-PRO-4M73-Y202",
  "TAS3EER-PRO-9P15-Z303",
  "TAS3EER-PRO-2L84-W404",
  "TAS3EER-PRO-7R36-V505"
];

export async function verifyLicense(licenseKey: string, deviceId: string) {
  const formattedKey = licenseKey.trim().toUpperCase();

  // التحقق أولاً من الأكواد المباشرة
  if (HARDCODED_LICENSES.includes(formattedKey)) {
    return {
      ok: true,
      message: "تم التفعيل بنجاح!",
    };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, message: "نظام التفعيل غير مُعدّ بعد. تواصل مع صاحب الأداة." };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/activate_license`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_license_key: formattedKey,
          p_device_id: deviceId,
        }),
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        message: typeof payload?.message === "string"
          ? payload.message
          : "تعذر الاتصال بخادم التفعيل.",
      };
    }

    return {
      ok: payload?.ok === true,
      message: typeof payload?.message === "string"
        ? payload.message
        : "كود التفعيل غير صحيح أو غير نشط.",
    };
  } catch {
    return { ok: false, message: "لا يوجد اتصال بالإنترنت. جرّب التفعيل مرة أخرى." };
  }
}
