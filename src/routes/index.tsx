import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
 BreakEvenCalculator,
 DiscountCalculator,
 PricingCalculator,
 ProfitCalculator,
 ShippingCalculator,
 VatCalculator,
} from "../components/pricing/calculators";
import { HistoryPanel } from "../components/pricing/history-panel";
import {
 IconArrow,
 IconHistory,
 IconPercent,
 IconReceipt,
 IconScale,
 IconTag,
 IconTrend,
 IconTruck,
 IconWifiOff,
} from "../components/pricing/icons";
import { useToast } from "../components/pricing/ui";
import { loadHistory, type HistoryEntry } from "../lib/history";
import { verifyLicense } from "../lib/license";

// ============================================================
// نظام التجربة والتفعيل — يعمل محلياً بعد التفعيل
// ============================================================
const TRIAL_LIMIT = 2;
const LICENSE_KEY_STORAGE = "app_license_key";
const DEVICE_ID_STORAGE = "client_device_id";
const TRIAL_COUNT_STORAGE = "pricing_trial_count";

function getDeviceId() {
 if (typeof window === "undefined") return "";
 let id = localStorage.getItem(DEVICE_ID_STORAGE);
 if (!id) {
   id =
     "DEV-" +
     crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
   localStorage.setItem(DEVICE_ID_STORAGE, id);
 }
 return id;
}

function getTrialCount() {
 if (typeof window === "undefined") return 0;
 const value = Number(localStorage.getItem(TRIAL_COUNT_STORAGE) || "0");
 return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export const Route = createFileRoute("/")({
 head: () => ({
   meta: [
     { title: "محترف التسعير Pro — منصة الذكاء المالي والتسعير للتجار" },
     {
       name: "description",
       content:
         "حاسبة التسعير الاحترافية للتجار: حساب الأرباح، الخصومات، الضريبة، الشحن ونقطة التعادل.",
     },
     {
       property: "og:title",
       content: "محترف التسعير Pro — منصة الذكاء المالي والتسعير للتجار",
     },
     {
       property: "og:description",
       content:
         "منصة احترافية لحساب وتسعير منتجات المتاجر وتحليل الربحية.",
     },
     { property: "og:type", content: "website" },
     { name: "twitter:card", content: "summary_large_image" },
   ],
 }),
 component: ProtectedAppGuard,
});

function ProtectedAppGuard() {
 const [isActivated, setIsActivated] = useState(false);
 const [inputKey, setInputKey] = useState("");
 const [trialCount, setTrialCount] = useState(0);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [isVerifying, setIsVerifying] = useState(false);

 const deviceId = getDeviceId();

 useEffect(() => {
   const savedKey = localStorage.getItem(LICENSE_KEY_STORAGE)?.trim();
   const count = getTrialCount();

   setTrialCount(count);

   if (savedKey) {
     const boundDevice = localStorage.getItem("bound_device_" + savedKey);
     if (boundDevice === deviceId || !boundDevice) {
       localStorage.setItem("bound_device_" + savedKey, deviceId);
       setIsActivated(true);
     }
   }

   setLoading(false);
 }, [deviceId]);

 const verifyKey = async (rawKey: string) => {
   const key = rawKey.trim().toUpperCase();
   setError("");

   if (!key) {
     setError("اكتب كود التفعيل أولاً.");
     return;
   }

   if (!/^PRP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
     setError("صيغة كود التفعيل غير صحيحة.");
     return;
   }

   setIsVerifying(true);
   try {
     const result = await verifyLicense(key, deviceId);

     if (!result.ok) {
       setError(result.message || "كود التفعيل غير صحيح أو غير نشط.");
       return;
     }

     localStorage.setItem("bound_device_" + key, deviceId);
     localStorage.setItem(LICENSE_KEY_STORAGE, key);
     setIsActivated(true);
   } finally {
     setIsVerifying(false);
   }
 };

 if (loading) return null;

 if (isActivated) return <Dashboard />;

 // قبل استهلاك التجربتين: يسمح بالدخول.
 if (trialCount < TRIAL_LIMIT) {
   return (
     <TrialGate
       remaining={TRIAL_LIMIT - trialCount}
       onStart={() => {
         const next = getTrialCount() + 1;
         localStorage.setItem(TRIAL_COUNT_STORAGE, String(next));
         setTrialCount(next);
       }}
       onActivate={() => {
         setError("");
         window.scrollTo({ top: 0, behavior: "smooth" });
       }}
       inputKey={inputKey}
       setInputKey={setInputKey}
       verifyKey={verifyKey}
       isVerifying={isVerifying}
       error={error}
     />
   );
 }

 return (
   <ActivationScreen
     inputKey={inputKey}
     setInputKey={setInputKey}
     verifyKey={verifyKey}
     isVerifying={isVerifying}
     error={error}
   />
 );
}

function TrialGate({
 remaining,
 onStart,
 inputKey,
 setInputKey,
 verifyKey,
 isVerifying,
 error,
}: {
 remaining: number;
 onStart: () => void;
 onActivate: () => void;
 inputKey: string;
 setInputKey: (v: string) => void;
 verifyKey: (v: string) => void | Promise<void>;
 isVerifying: boolean;
 error: string;
}) {
 const [showActivation, setShowActivation] = useState(false);

 return (
   <div
     dir="rtl"
     className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4 font-sans text-white"
   >
     <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/95 p-7 text-center shadow-2xl">
       <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/30">
         <IconTag className="h-8 w-8 text-blue-400" />
       </div>

       <h1 className="mt-5 text-2xl font-black">محترف التسعير Pro</h1>

       <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
         <div className="text-3xl font-black text-blue-400">{remaining}</div>
         <div className="mt-1 text-sm font-bold">تجربة مجانية متبقية</div>
         <p className="mt-2 text-xs text-slate-400">
           لديك تجربتان مجانيتان للأداة، وبعد انتهاء التجربة تحتاج إلى كود
           تفعيل للاستمرار.
         </p>
       </div>

       {!showActivation ? (
         <>
           <button
             type="button"
             onClick={onStart}
             className="mt-5 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black transition hover:bg-blue-500"
           >
             ابدأ التجربة المجانية
           </button>

           <button
             type="button"
             onClick={() => setShowActivation(true)}
             className="mt-3 w-full rounded-2xl border border-slate-600 bg-slate-900/60 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700"
           >
             لدي كود تفعيل
           </button>
         </>
       ) : (
         <ActivationForm
           inputKey={inputKey}
           setInputKey={setInputKey}
           verifyKey={verifyKey}
           isVerifying={isVerifying}
           error={error}
         />
       )}
     </div>
   </div>
 );
}

function ActivationScreen({
 inputKey,
 setInputKey,
 verifyKey,
 isVerifying,
 error,
}: {
 inputKey: string;
 setInputKey: (v: string) => void;
 verifyKey: (v: string) => void | Promise<void>;
 isVerifying: boolean;
 error: string;
}) {
 return (
   <div
     dir="rtl"
     className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4 font-sans text-white"
   >
     <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/95 p-8 text-center shadow-2xl">
       <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
         <IconTag className="h-8 w-8 text-amber-400" />
       </div>

       <h2 className="mt-5 text-2xl font-black">انتهت التجربة المجانية</h2>

       <p className="mt-3 text-sm leading-7 text-slate-400">
         استخدمت التجربتين المجانيتين. لتكملة استخدام جميع حاسبات محترف
         التسعير Pro، فعّل النسخة الكاملة.
       </p>

       <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
         <div className="text-xs font-bold text-emerald-400">
           سعر النسخة الكاملة
         </div>
         <div className="mt-1 text-3xl font-black">200 جنيه</div>
         <div className="mt-1 text-xs text-slate-400">دفع مرة واحدة</div>
       </div>

       <ActivationForm
         inputKey={inputKey}
         setInputKey={setInputKey}
         verifyKey={verifyKey}
         isVerifying={isVerifying}
         error={error}
       />

       <p className="mt-5 text-[11px] leading-5 text-slate-500">
         بعد التفعيل يتم حفظ الترخيص على هذا الجهاز ويمكن استخدام الأداة
         محلياً بدون الحاجة لاتصال مستمر بالإنترنت.
       </p>
     </div>
   </div>
 );
}

function ActivationForm({
 inputKey,
 setInputKey,
 verifyKey,
 isVerifying,
 error,
}: {
 inputKey: string;
 setInputKey: (v: string) => void;
 verifyKey: (v: string) => void | Promise<void>;
 isVerifying: boolean;
 error: string;
}) {
 return (
   <div className="mt-5 space-y-3">
     <input
       type="text"
       value={inputKey}
       onChange={(e) => setInputKey(e.target.value.toUpperCase())}
       onKeyDown={(e) => {
         if (e.key === "Enter") verifyKey(inputKey);
       }}
       placeholder="PRP-XXXX-XXXX-XXXX"
       className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3.5 text-center text-sm font-black tracking-wider text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
     />

     <button
       type="button"
       onClick={() => verifyKey(inputKey)}
       disabled={!inputKey.trim() || isVerifying}
       className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black transition hover:bg-blue-500 disabled:opacity-50"
     >
       {isVerifying ? "جاري التحقق..." : "تفعيل النظام الآن"}
     </button>

     {error && (
       <p className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400">
         {error}
       </p>
     )}
   </div>
 );
}

// ============================================================
// الحاسبات الخمس الجديدة
// ============================================================

function ReturnLeakageCalculator() {
 const [cost, setCost] = useState(0);
 const [shipping, setShipping] = useState(0);
 const [returnShipping, setReturnShipping] = useState(0);
 const [desiredProfit, setDesiredProfit] = useState(0);
 const [returnRate, setReturnRate] = useState(15);

 const totalBaseCost = cost + shipping;
 const returnCostPerOrder =
   (Math.max(0, returnRate) / 100) * (shipping + returnShipping);
 const adjustedCost = totalBaseCost + returnCostPerOrder;
 const safeSellingPrice = adjustedCost + desiredProfit;

 return (
   <div className="fade-up space-y-6">
     <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
       <h3 className="text-lg font-bold text-primary">
         رادار المرتجعات والـ RTO
       </h3>
       <p className="mt-1 text-xs text-muted-foreground">
         احسب سعر البيع الآمن الذي يغطي تكاليف الشحنات المرتجعة وغير المستلمة.
       </p>

       <div className="mt-6 grid gap-4 sm:grid-cols-2">
         {[
           ["سعر شراء المنتج (ج.م)", setCost],
           ["تكلفة الشحن الأصلي (ج.م)", setShipping],
           ["تكلفة شحن الإرجاع (ج.م)", setReturnShipping],
           ["نسبة المرتجعات المتوقعة (%)", setReturnRate],
           ["صافي الربح المطلوب (ج.م)", setDesiredProfit],
         ].map(([label, setter], i) => (
           <div key={String(label)} className={i === 4 ? "sm:col-span-2" : ""}>
             <label className="text-xs font-bold">{label as string}</label>
             <input
               type="number"
               value={i === 3 ? returnRate : undefined}
               onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))}
               className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold"
             />
           </div>
         ))}
       </div>
     </div>

     <div className="grid gap-4 sm:grid-cols-3">
       <Result title="تكلفة المرتجع لكل طلب" value={returnCostPerOrder} />
       <Result title="إجمالي التكلفة الحقيقية" value={adjustedCost} />
       <Result title="سعر البيع الآمن المقترح" value={safeSellingPrice} />
     </div>
   </div>
 );
}

function AdSpendSafetyCalculator() {
 const [price, setPrice] = useState(0);
 const [cost, setCost] = useState(0);
 const [desiredProfit, setDesiredProfit] = useState(0);

 const maxCPA = price - cost - desiredProfit;
 const breakEvenCPA = price - cost;
 const targetROAS = maxCPA > 0 ? price / maxCPA : 0;

 return (
   <div className="fade-up space-y-6">
     <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
       <h3 className="text-lg font-bold text-primary">
         حاسبة حد الأمان للإعلانات
       </h3>
       <p className="mt-1 text-xs text-muted-foreground">
         اعرف أقصى تكلفة إعلان قبل أن تتحول الحملة إلى خسارة.
       </p>

       <div className="mt-6 grid gap-4 sm:grid-cols-3">
         <Field label="سعر البيع النهائي" setter={setPrice} />
         <Field label="التكلفة الكلية" setter={setCost} />
         <Field label="صافي الربح المخطط" setter={setDesiredProfit} />
       </div>
     </div>

     <div className="grid gap-4 sm:grid-cols-3">
       <Result title="Break-even CPA" value={breakEvenCPA} />
       <Result title="Target CPA" value={Math.max(0, maxCPA)} />
       <Result title="Target ROAS" valueText={targetROAS > 0 ? `${targetROAS.toFixed(2)}x` : "0.00x"} />
     </div>
   </div>
 );
}

function BundleComboCalculator() {
 const [p1Cost, setP1Cost] = useState(0);
 const [p2Cost, setP2Cost] = useState(0);
 const [packaging, setPackaging] = useState(0);
 const [shipping, setShipping] = useState(0);
 const [bundlePrice, setBundlePrice] = useState(0);

 const totalCost = p1Cost + p2Cost + packaging + shipping;
 const netProfit = bundlePrice - totalCost;
 const margin = bundlePrice > 0 ? (netProfit / bundlePrice) * 100 : 0;

 return (
   <div className="fade-up space-y-6">
     <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
       <h3 className="text-lg font-bold text-primary">
         حاسبة العروض المركبة والـ Bundles
       </h3>
       <div className="mt-6 grid gap-4 sm:grid-cols-3">
         <Field label="تكلفة المنتج الأول" setter={setP1Cost} />
         <Field label="تكلفة المنتج الثاني" setter={setP2Cost} />
         <Field label="تكلفة التغليف" setter={setPackaging} />
         <Field label="تكلفة الشحن" setter={setShipping} />
         <Field label="سعر بيع العرض" setter={setBundlePrice} className="sm:col-span-2" />
       </div>
     </div>

     <div className="grid gap-4 sm:grid-cols-3">
       <Result title="التكلفة الكلية" value={totalCost} />
       <Result title="صافي ربح العرض" value={netProfit} />
       <Result title="هامش الربح" valueText={`${margin.toFixed(1)}%`} />
     </div>
   </div>
 );
}

function OverheadAllocator() {
 const [rent, setRent] = useState(0);
 const [salaries, setSalaries] = useState(0);
 const [software, setSoftware] = useState(0);
 const [orders, setOrders] = useState(100);

 const fixed = rent + salaries + software;
 const perUnit = orders > 0 ? fixed / orders : 0;
 const requiredOrders = perUnit > 0 ? Math.ceil(fixed / perUnit) : 0;

 return (
   <div className="fade-up space-y-6">
     <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
       <h3 className="text-lg font-bold text-primary">
         مُوزّع التكاليف الثابتة
       </h3>
       <div className="mt-6 grid gap-4 sm:grid-cols-2">
         <Field label="الإيجار الشهري" setter={setRent} />
         <Field label="المرتبات والفواتير" setter={setSalaries} />
         <Field label="البرامج والاشتراكات" setter={setSoftware} />
         <Field label="عدد الطلبات شهرياً" setter={setOrders} defaultValue={100} />
       </div>
     </div>

     <div className="grid gap-4 sm:grid-cols-3">
       <Result title="المصاريف الثابتة الشهرية" value={fixed} />
       <Result title="حصة التكلفة لكل طلب" value={perUnit} />
       <Result title="عدد الطلبات لتغطية المصاريف" valueText={requiredOrders ? String(requiredOrders) : "—"} />
     </div>
   </div>
 );
}

function BusinessReportGenerator() {
 const [store, setStore] = useState("");
 const [product, setProduct] = useState("");
 const [cost, setCost] = useState(0);
 const [price, setPrice] = useState(0);

 const profit = price - cost;
 const margin = price > 0 ? (profit / price) * 100 : 0;

 return (
   <div className="fade-up space-y-6">
     <div className="no-print rounded-3xl border border-border bg-card p-6 shadow-sm">
       <h3 className="text-lg font-bold text-primary">
         استخراج تقرير مالي PDF
       </h3>

       <div className="mt-6 grid gap-4 sm:grid-cols-2">
         <TextField label="اسم المتجر / البراند" setter={setStore} />
         <TextField label="اسم المنتج" setter={setProduct} />
         <Field label="التكلفة الكلية" setter={setCost} />
         <Field label="سعر البيع" setter={setPrice} />
       </div>

       <button
         type="button"
         onClick={() => window.print()}
         className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
       >
         طباعة / حفظ التقرير كـ PDF
       </button>
     </div>

     <div className="rounded-3xl border border-border bg-card p-8 shadow-md">
       <div className="flex items-center justify-between border-b border-border pb-4">
         <div>
           <h2 className="text-xl font-black">{store || "تقرير تسعير منتج"}</h2>
           <p className="text-xs text-muted-foreground">
             صادر عن محترف التسعير Pro
           </p>
         </div>
         <div className="text-left text-xs font-bold text-muted-foreground">
           {new Date().toLocaleDateString("ar-EG")}
         </div>
       </div>

       <div className="mt-6 space-y-4 text-sm">
         <Row label="اسم المنتج" value={product || "غير محدد"} />
         <Row label="التكلفة" value={`${cost.toFixed(2)} ج.م`} />
         <Row label="سعر البيع" value={`${price.toFixed(2)} ج.م`} />
         <Row label="صافي الربح" value={`${profit.toFixed(2)} ج.م`} />
         <Row label="هامش الربح" value={`${margin.toFixed(1)}%`} />
       </div>
     </div>
   </div>
 );
}

function Field({
 label,
 setter,
 defaultValue,
 className = "",
}: {
 label: string;
 setter: (n: number) => void;
 defaultValue?: number;
 className?: string;
}) {
 return (
   <div className={className}>
     <label className="text-xs font-bold">{label} (ج.م)</label>
     <input
       type="number"
       defaultValue={defaultValue}
       onChange={(e) => setter(Number(e.target.value))}
       className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold"
     />
   </div>
 );
}

function TextField({
 label,
 setter,
}: {
 label: string;
 setter: (v: string) => void;
}) {
 return (
   <div>
     <label className="text-xs font-bold">{label}</label>
     <input
       type="text"
       onChange={(e) => setter(e.target.value)}
       className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold"
     />
   </div>
 );
}

function Result({
 title,
 value,
 valueText,
}: {
 title: string;
 value?: number;
 valueText?: string;
}) {
 return (
   <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-center">
     <div className="text-xs font-bold text-muted-foreground">{title}</div>
     <div className="mt-1 text-2xl font-extrabold text-primary">
       {valueText ?? `${(value ?? 0).toFixed(2)} ج.م`}
     </div>
   </div>
 );
}

function Row({ label, value }: { label: string; value: string }) {
 return (
   <div className="flex justify-between border-b border-border/50 pb-2">
     <span className="font-bold">{label}</span>
     <span>{value}</span>
   </div>
 );
}

// ============================================================
// لوحة التحكم
// ============================================================

type ToolKey =
 | "pricing"
 | "profit"
 | "discount"
 | "vat"
 | "shipping"
 | "breakeven"
 | "rto"
 | "adspend"
 | "bundle"
 | "overhead"
 | "report"
 | "history";

type Tool = {
 key: ToolKey;
 title: string;
 desc: string;
 Icon: ComponentType<{ className?: string }>;
 accent: string;
 Component?: ComponentType<{
   notify?: (m: string) => void;
   onSaved?: (l: HistoryEntry[]) => void;
 }>;
};

const tools: Tool[] = [
 {
   key: "rto",
   title: "رادار المرتجعات والـ RTO",
   desc: "حماية أرباحك من تكاليف الشحنات المرتجعة",
   Icon: IconScale,
   accent: "text-destructive",
   Component: ReturnLeakageCalculator,
 },
 {
   key: "adspend",
   title: "حاسبة حد الأمان للإعلانات",
   desc: "حساب Target CPA و ROAS الآمن",
   Icon: IconTrend,
   accent: "text-warning",
   Component: AdSpendSafetyCalculator,
 },
 {
   key: "bundle",
   title: "حاسبة العروض والـ Bundles",
   desc: "تسعير العروض والكومبو بدون خسارة",
   Icon: IconTag,
   accent: "text-success",
   Component: BundleComboCalculator,
 },
 {
   key: "overhead",
   title: "مُوزّع التكاليف الثابتة",
   desc: "توزيع الإيجار والمرتبات على كل طلب",
   Icon: IconReceipt,
   accent: "text-primary",
   Component: OverheadAllocator,
 },
 {
   key: "report",
   title: "استخراج تقرير مالي PDF",
   desc: "طباعة دراسة تسعير باسم متجرك",
   Icon: IconHistory,
   accent: "text-gold",
   Component: BusinessReportGenerator,
 },
 {
   key: "pricing",
   title: "حاسبة تسعير المنتجات",
   desc: "سعر بيع مثالي وتحليل الربحية",
   Icon: IconTag,
   accent: "text-primary",
   Component: PricingCalculator,
 },
 {
   key: "profit",
   title: "حاسبة الأرباح",
   desc: "صافي الربح ونسبة وهامش الربح",
   Icon: IconTrend,
   accent: "text-success",
   Component: ProfitCalculator,
 },
 {
   key: "discount",
   title: "حاسبة الخصومات",
   desc: "قيمة الخصم والسعر النهائي",
   Icon: IconPercent,
   accent: "text-warning",
   Component: DiscountCalculator,
 },
 {
   key: "vat",
   title: "حاسبة الضريبة",
   desc: "قيمة الضريبة والسعر شامل وغير شامل",
   Icon: IconReceipt,
   accent: "text-accent",
   Component: VatCalculator,
 },
 {
   key: "shipping",
   title: "حاسبة الشحن",
   desc: "إجمالي ومتوسط تكلفة الشحن",
   Icon: IconTruck,
   accent: "text-primary",
   Component: ShippingCalculator,
 },
 {
   key: "breakeven",
   title: "حاسبة نقطة التعادل",
   desc: "عدد الوحدات لتغطية تكاليفك",
   Icon: IconScale,
   accent: "text-gold",
   Component: BreakEvenCalculator,
 },
 {
   key: "history",
   title: "سجل الحسابات",
   desc: "كل حساباتك المحفوظة على جهازك",
   Icon: IconHistory,
   accent: "text-muted-foreground",
 },
];

function Dashboard() {
 const [active, setActive] = useState<ToolKey | null>(null);
 const [history, setHistory] = useState<HistoryEntry[]>([]);
 const { show, node } = useToast();

 useEffect(() => {
   setHistory(loadHistory());
 }, []);

 const activeTool = tools.find((t) => t.key === active) ?? null;

 return (
   <div dir="rtl" className="min-h-screen">
     <header className="no-print sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
       <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
         <div className="flex items-center gap-3">
           <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
             <IconTag className="h-6 w-6 text-primary" />
           </div>
           <div className="leading-tight">
             <h1 className="text-base font-extrabold sm:text-lg">
               محترف التسعير Pro
               <span className="mr-2 text-[11px] font-bold text-muted-foreground">
                 Smart Pricing Enterprise
               </span>
             </h1>
             <p className="text-[11px] text-muted-foreground">
               منصة الذكاء المالي للتجار
             </p>
           </div>
         </div>

         <div className="hidden items-center gap-2 rounded-full bg-success/12 px-3 py-1.5 text-[11px] font-bold text-success ring-1 ring-success/25 sm:flex">
           <IconWifiOff className="h-3.5 w-3.5" />
           يعمل محلياً
         </div>
       </div>
     </header>

     <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
       {activeTool === null ? (
         <>
           <section className="fade-up glass relative overflow-hidden rounded-3xl p-6 sm:p-9">
             <span className="inline-flex items-center rounded-full bg-secondary/50 px-3 py-1 text-[11px] font-bold text-muted-foreground ring-1 ring-border">
               نظام التسعير والتخطيط المالي للمتاجر
             </span>

             <h2 className="mt-4 text-2xl font-extrabold leading-snug sm:text-4xl">
               احمِ أرباح متجرك{" "}
               <span className="text-gradient">من الخسائر المخفية</span>
             </h2>

             <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
               ١١ حاسبة احترافية تساعدك على التسعير، الربح، الخصومات، الضريبة،
               الشحن، نقطة التعادل، المرتجعات والإعلانات.
             </p>

             <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
               {[
                 { k: "١١", v: "حاسبة" },
                 { k: "EGP", v: "جنيه مصري" },
                 { k: "محلي", v: "بياناتك على جهازك" },
               ].map((s) => (
                 <div key={s.v} className="rounded-2xl bg-secondary/35 p-3 text-center">
                   <div className="num text-xl font-extrabold text-primary">{s.k}</div>
                   <div className="text-[11px] text-muted-foreground">{s.v}</div>
                 </div>
               ))}
             </div>
           </section>

           <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {tools.map((t, i) => (
               <button
                 key={t.key}
                 type="button"
                 onClick={() => setActive(t.key)}
                 style={{ animationDelay: `${i * 45}ms` }}
                 className="fade-up glass glass-hover group rounded-3xl p-5 text-right"
               >
                 <div className="flex items-start justify-between">
                   <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/50 ring-1 ring-border">
                     <t.Icon className={`h-6 w-6 ${t.accent}`} />
                   </div>
                   <span className="num rounded-full bg-secondary/40 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                     {t.key === "history"
                       ? history.length
                       : String(i + 1).padStart(2, "0")}
                   </span>
                 </div>

                 <h3 className="mt-4 text-base font-extrabold">{t.title}</h3>
                 <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                   {t.desc}
                 </p>

                 <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-primary">
                   ابدأ الآن
                   <IconArrow className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                 </span>
               </button>
             ))}
           </div>
         </>
       ) : (
         <>
           <button
             type="button"
             onClick={() => setActive(null)}
             className="no-print mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 text-[13px] font-semibold hover:bg-secondary/70"
           >
             <IconArrow className="h-4 w-4 rotate-180" />
             رجوع إلى لوحة التحكم
           </button>

           {activeTool.key === "history" ? (
             <HistoryPanel entries={history} onChange={setHistory} notify={show} />
           ) : activeTool.Component ? (
             <activeTool.Component notify={show} onSaved={setHistory} />
           ) : null}
         </>
       )}

       <footer className="no-print mt-12 flex flex-col items-center gap-1 text-center text-[11px] text-muted-foreground">
         <p className="font-bold text-foreground/80">
           محترف التسعير Pro — Smart Pricing Enterprise v2.0
         </p>
         <p>تطوير: Mahmoud Mansour — بيانات الحسابات تبقى على جهازك</p>
       </footer>
     </main>

     {node}
   </div>
 );
}
