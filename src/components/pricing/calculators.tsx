import { useEffect, useMemo, useState } from "react";
import {
  analyzePricing,
  analyzeProfit,
  calcBreakEven,
  calcDiscount,
  calcPricing,
  calcProfit,
  calcShipping,
  calcVat,
  fmt,
  money,
  num,
  percent,
} from "@/lib/pricing";
import { loadDraft, saveDraft, saveEntry, type HistoryEntry } from "@/lib/history";
import { AnalysisCard, Field, Result, ToolActions, ToolPanel, copyToClipboard } from "./ui";

type Notify = (msg: string) => void;
type OnSaved = (list: HistoryEntry[]) => void;

function useDraft<T extends Record<string, string>>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    setState(loadDraft<T>(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    saveDraft(key, state);
  }, [key, state]);

  const set = (field: keyof T) => (v: string) => setState((s) => ({ ...s, [field]: v }));
  const reset = () => setState(initial);
  return { state, set, reset };
}

function buildText(
  title: string,
  inputs: { label: string; value: string }[],
  results: { label: string; value: string }[],
  status?: string,
) {
  const lines = [
    "محترف التسعير — Smart Pricing Pro",
    `الأداة: ${title}`,
    "",
    "المدخلات:",
    ...inputs.map((i) => `• ${i.label}: ${i.value}`),
    "",
    "النتائج:",
    ...results.map((r) => `• ${r.label}: ${r.value}`),
  ];
  if (status) lines.push("", `التحليل: ${status}`);
  return lines.join("\n");
}

/* ========================== 1) حاسبة تسعير المنتجات ========================= */

const pricingInit = {
  purchase: "",
  shipping: "",
  packaging: "",
  ads: "",
  commissionPct: "",
  other: "",
  marginPct: "30",
};

export function PricingCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("pricing", pricingInit);

  const inputs = useMemo(
    () => ({
      purchase: num(state.purchase),
      shipping: num(state.shipping),
      packaging: num(state.packaging),
      ads: num(state.ads),
      commissionPct: num(state.commissionPct),
      other: num(state.other),
      marginPct: num(state.marginPct),
    }),
    [state],
  );

  const r = useMemo(() => calcPricing(inputs), [inputs]);
  const analysis = useMemo(() => analyzePricing(inputs, r), [inputs, r]);
  const hasData = inputs.purchase > 0 || r.baseCost > 0;

  const inputRows = [
    { label: "سعر شراء المنتج", value: money(inputs.purchase) },
    { label: "تكلفة الشحن", value: money(inputs.shipping) },
    { label: "تكلفة التغليف", value: money(inputs.packaging) },
    { label: "تكلفة الإعلان", value: money(inputs.ads) },
    { label: "عمولة المنصة", value: percent(inputs.commissionPct) },
    { label: "مصروفات أخرى", value: money(inputs.other) },
    { label: "نسبة الربح المطلوبة", value: percent(inputs.marginPct) },
  ];
  const resultRows = [
    { label: "إجمالي التكلفة", value: money(r.totalCost) },
    { label: "سعر التعادل", value: money(r.breakEvenPrice) },
    { label: "سعر البيع المقترح", value: money(r.suggestedPrice) },
    { label: "صافي الربح", value: money(r.netProfit) },
    { label: "هامش الربح", value: percent(r.marginPct) },
    { label: "ROI", value: percent(r.roiPct) },
  ];

  return (
    <ToolPanel
      title="حاسبة تسعير المنتجات"
      description="أدخل كل تكاليفك وسنحسب سعر البيع الأمثل مع تحليل ذكي للربحية."
      inputs={
        <>
          <Field label="سعر شراء المنتج" value={state.purchase} onChange={set("purchase")} />
          <Field label="تكلفة الشحن" value={state.shipping} onChange={set("shipping")} />
          <Field label="تكلفة التغليف" value={state.packaging} onChange={set("packaging")} />
          <Field label="تكلفة الإعلان" value={state.ads} onChange={set("ads")} />
          <Field
            label="عمولة المنصة"
            value={state.commissionPct}
            onChange={set("commissionPct")}
            suffix="%"
            hint="نسبة من سعر البيع النهائي"
          />
          <Field label="مصروفات أخرى" value={state.other} onChange={set("other")} />
          <Field
            label="نسبة الربح المطلوبة"
            value={state.marginPct}
            onChange={set("marginPct")}
            suffix="%"
          />
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="سعر البيع المقترح" value={money(r.suggestedPrice)} tone="primary" big />
            <Result
              label="صافي الربح للوحدة"
              value={money(r.netProfit)}
              tone={r.netProfit > 0 ? "success" : "danger"}
              big
            />
            <Result label="إجمالي التكلفة" value={money(r.totalCost)} />
            <Result label="سعر التعادل" value={money(r.breakEvenPrice)} tone="warning" />
            <Result label="هامش الربح" value={percent(r.marginPct)} />
            <Result label="العائد على التكلفة ROI" value={percent(r.roiPct)} />
          </div>
          {hasData ? <AnalysisCard analysis={analysis} /> : null}
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة تسعير المنتجات",
                  toolKey: "pricing",
                  inputs: inputRows,
                  results: resultRows,
                  status: analysis.label,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(
                buildText("حاسبة تسعير المنتجات", inputRows, resultRows, analysis.label),
              );
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}

/* ============================= 2) حاسبة الأرباح ============================ */

const profitInit = { purchase: "", selling: "", expenses: "" };

export function ProfitCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("profit", profitInit);
  const purchase = num(state.purchase);
  const selling = num(state.selling);
  const expenses = num(state.expenses);
  const r = calcProfit(purchase, selling, expenses);
  const analysis = analyzeProfit(r);
  const hasData = selling > 0 || purchase > 0;

  const inputRows = [
    { label: "سعر الشراء", value: money(purchase) },
    { label: "سعر البيع", value: money(selling) },
    { label: "المصاريف", value: money(expenses) },
  ];
  const resultRows = [
    { label: "صافي الربح", value: money(r.netProfit) },
    { label: "نسبة الربح", value: percent(r.profitPct) },
    { label: "هامش الربح", value: percent(r.marginPct) },
  ];

  return (
    <ToolPanel
      title="حاسبة الأرباح"
      description="اعرف صافي ربحك ونسبة الربح وهامش الربح من أي عملية بيع."
      inputs={
        <>
          <Field label="سعر الشراء" value={state.purchase} onChange={set("purchase")} />
          <Field label="سعر البيع" value={state.selling} onChange={set("selling")} />
          <Field label="المصاريف" value={state.expenses} onChange={set("expenses")} />
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result
              label="صافي الربح"
              value={money(r.netProfit)}
              tone={r.netProfit > 0 ? "success" : "danger"}
              big
            />
            <Result label="إجمالي التكلفة" value={money(r.totalCost)} />
            <Result label="نسبة الربح" value={percent(r.profitPct)} tone="primary" />
            <Result label="هامش الربح" value={percent(r.marginPct)} tone="primary" />
          </div>
          {hasData ? <AnalysisCard analysis={analysis} /> : null}
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة الأرباح",
                  toolKey: "profit",
                  inputs: inputRows,
                  results: resultRows,
                  status: analysis.label,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(buildText("حاسبة الأرباح", inputRows, resultRows, analysis.label));
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}

/* ============================ 3) حاسبة الخصومات =========================== */

const discountInit = { original: "", discountPct: "" };

export function DiscountCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("discount", discountInit);
  const original = num(state.original);
  const pct = num(state.discountPct);
  const r = calcDiscount(original, pct);

  const inputRows = [
    { label: "السعر الأصلي", value: money(original) },
    { label: "نسبة الخصم", value: percent(pct) },
  ];
  const resultRows = [
    { label: "قيمة الخصم", value: money(r.discountValue) },
    { label: "السعر بعد الخصم", value: money(r.finalPrice) },
  ];

  return (
    <ToolPanel
      title="حاسبة الخصومات"
      description="احسب قيمة الخصم والسعر النهائي قبل إطلاق أي عرض."
      inputs={
        <>
          <Field label="السعر الأصلي" value={state.original} onChange={set("original")} />
          <Field
            label="نسبة الخصم"
            value={state.discountPct}
            onChange={set("discountPct")}
            suffix="%"
          />
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="السعر بعد الخصم" value={money(r.finalPrice)} tone="primary" big />
            <Result label="قيمة الخصم" value={money(r.discountValue)} tone="warning" big />
            <Result label="السعر الأصلي" value={money(original)} />
            <Result label="يوفر العميل" value={percent(pct)} tone="success" />
          </div>
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة الخصومات",
                  toolKey: "discount",
                  inputs: inputRows,
                  results: resultRows,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(buildText("حاسبة الخصومات", inputRows, resultRows));
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}

/* ============================= 4) حاسبة الضريبة ============================ */

const vatInit = { price: "", ratePct: "14" };

export function VatCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("vat", vatInit);
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const price = num(state.price);
  const rate = num(state.ratePct);
  const r = calcVat(price, rate, mode);

  const inputRows = [
    { label: "السعر", value: money(price) },
    { label: "نسبة الضريبة", value: percent(rate) },
    { label: "نوع السعر", value: mode === "exclusive" ? "غير شامل الضريبة" : "شامل الضريبة" },
  ];
  const resultRows = [
    { label: "قيمة الضريبة", value: money(r.vatValue) },
    { label: "السعر شامل الضريبة", value: money(r.withVat) },
    { label: "السعر قبل الضريبة", value: money(r.beforeVat) },
  ];

  return (
    <ToolPanel
      title="حاسبة الضريبة (VAT)"
      description="احسب ضريبة القيمة المضافة سواء كان السعر شاملاً الضريبة أو غير شامل."
      inputs={
        <>
          <Field label="السعر" value={state.price} onChange={set("price")} />
          <Field label="نسبة الضريبة" value={state.ratePct} onChange={set("ratePct")} suffix="%" />
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
              نوع السعر المُدخل
            </span>
            <div className="flex gap-2">
              {(
                [
                  { key: "exclusive", label: "غير شامل الضريبة" },
                  { key: "inclusive", label: "شامل الضريبة" },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setMode(o.key)}
                  className={
                    mode === o.key
                      ? "h-11 flex-1 rounded-xl border border-primary/50 bg-primary/20 text-sm font-bold text-primary"
                      : "h-11 flex-1 rounded-xl border border-border bg-secondary/40 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70"
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="السعر شامل الضريبة" value={money(r.withVat)} tone="primary" big />
            <Result label="قيمة الضريبة" value={money(r.vatValue)} tone="warning" big />
            <Result label="السعر قبل الضريبة" value={money(r.beforeVat)} />
            <Result label="نسبة الضريبة" value={percent(rate)} />
          </div>
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة الضريبة",
                  toolKey: "vat",
                  inputs: inputRows,
                  results: resultRows,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(buildText("حاسبة الضريبة", inputRows, resultRows));
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}

/* ============================= 5) حاسبة الشحن ============================= */

const shippingInit = { cost: "", orders: "" };

export function ShippingCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("shipping", shippingInit);
  const cost = num(state.cost);
  const orders = Math.max(0, Math.floor(num(state.orders)));
  const r = calcShipping(cost, orders);

  const inputRows = [
    { label: "تكلفة الشحن للطلب", value: money(cost) },
    { label: "عدد الطلبات", value: fmt(orders, 0) },
  ];
  const resultRows = [
    { label: "متوسط تكلفة الشحن لكل طلب", value: money(r.average) },
    { label: "إجمالي تكلفة الشحن", value: money(r.total) },
  ];

  return (
    <ToolPanel
      title="حاسبة الشحن"
      description="اعرف إجمالي تكلفة الشحن ومتوسط التكلفة لكل طلب."
      inputs={
        <>
          <Field label="تكلفة الشحن" value={state.cost} onChange={set("cost")} />
          <Field label="عدد الطلبات" value={state.orders} onChange={set("orders")} suffix="طلب" />
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result label="إجمالي تكلفة الشحن" value={money(r.total)} tone="primary" big />
            <Result label="متوسط التكلفة لكل طلب" value={money(r.average)} tone="success" big />
            <Result label="عدد الطلبات" value={fmt(orders, 0)} />
            <Result label="تكلفة الشحن المُدخلة" value={money(cost)} />
          </div>
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة الشحن",
                  toolKey: "shipping",
                  inputs: inputRows,
                  results: resultRows,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(buildText("حاسبة الشحن", inputRows, resultRows));
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}

/* =========================== 6) حاسبة نقطة التعادل ========================= */

const breakEvenInit = { fixedCosts: "", unitCost: "", sellingPrice: "" };

export function BreakEvenCalculator({ notify, onSaved }: { notify: Notify; onSaved: OnSaved }) {
  const { state, set, reset } = useDraft("breakeven", breakEvenInit);
  const fixedCosts = num(state.fixedCosts);
  const unitCost = num(state.unitCost);
  const sellingPrice = num(state.sellingPrice);
  const r = calcBreakEven(fixedCosts, unitCost, sellingPrice);
  const impossible = !Number.isFinite(r.units);

  const unitsText = impossible ? "غير ممكن" : `${fmt(r.unitsRounded, 0)} وحدة`;

  const inputRows = [
    { label: "التكاليف الثابتة", value: money(fixedCosts) },
    { label: "تكلفة المنتج", value: money(unitCost) },
    { label: "سعر البيع", value: money(sellingPrice) },
  ];
  const resultRows = [
    { label: "عدد المنتجات لنقطة التعادل", value: unitsText },
    { label: "هامش المساهمة للوحدة", value: money(r.contribution) },
    { label: "إيرادات نقطة التعادل", value: impossible ? "—" : money(r.revenue) },
  ];

  return (
    <ToolPanel
      title="حاسبة نقطة التعادل"
      description="كم وحدة يجب بيعها لتغطية تكاليفك الثابتة والبدء في الربح."
      inputs={
        <>
          <Field label="التكاليف الثابتة" value={state.fixedCosts} onChange={set("fixedCosts")} />
          <Field label="تكلفة المنتج" value={state.unitCost} onChange={set("unitCost")} />
          <Field label="سعر البيع" value={state.sellingPrice} onChange={set("sellingPrice")} />
        </>
      }
      results={
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Result
              label="عدد المنتجات المطلوبة"
              value={unitsText}
              tone={impossible ? "danger" : "primary"}
              big
            />
            <Result
              label="هامش المساهمة للوحدة"
              value={money(r.contribution)}
              tone={r.contribution > 0 ? "success" : "danger"}
              big
            />
            <Result label="إيرادات نقطة التعادل" value={impossible ? "—" : money(r.revenue)} />
            <Result label="التكاليف الثابتة" value={money(fixedCosts)} />
          </div>
          {impossible && sellingPrice > 0 ? (
            <AnalysisCard
              analysis={{
                status: "loss",
                label: "خسارة",
                reason: "سعر البيع لا يغطي تكلفة المنتج، لذلك لن تصل إلى نقطة التعادل مهما بعت.",
                tips: ["ارفع سعر البيع", "خفض تكلفة المنتج"],
              }}
            />
          ) : null}
          <ToolActions
            onSave={() => {
              onSaved(
                saveEntry({
                  tool: "حاسبة نقطة التعادل",
                  toolKey: "breakeven",
                  inputs: inputRows,
                  results: resultRows,
                }),
              );
              notify("تم حفظ الحساب في السجل");
            }}
            onCopy={() => {
              copyToClipboard(buildText("حاسبة نقطة التعادل", inputRows, resultRows));
              notify("تم نسخ النتائج");
            }}
            onReset={() => {
              reset();
              notify("تم تصفير الحاسبة");
            }}
          />
        </>
      }
    />
  );
}
