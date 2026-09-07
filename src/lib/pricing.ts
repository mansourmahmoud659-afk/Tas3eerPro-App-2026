/**
 * Smart Pricing Pro — محترف التسعير
 * كل الحسابات تتم محلياً على جهاز المستخدم بدون إنترنت.
 */

export const EGP = "ج.م";

export function num(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function money(value: number): string {
  return `${fmt(value)} ${EGP}`;
}

export function percent(value: number): string {
  return `${fmt(value, 1)}%`;
}

/* ---------------------------------- Types --------------------------------- */

export type Status = "excellent" | "good" | "warning" | "loss";

export type Analysis = {
  status: Status;
  label: string;
  reason: string;
  tips: string[];
};

export type PricingInputs = {
  purchase: number;
  shipping: number;
  packaging: number;
  ads: number;
  commissionPct: number;
  other: number;
  marginPct: number;
};

export type PricingResult = {
  baseCost: number;
  totalCost: number;
  breakEvenPrice: number;
  suggestedPrice: number;
  commissionValue: number;
  netProfit: number;
  marginPct: number;
  roiPct: number;
};

/* --------------------------- Pricing calculator --------------------------- */
/**
 * تكلفة الأساس = الشراء + الشحن + التغليف + الإعلان + مصروفات أخرى
 * عمولة المنصة تُحسب كنسبة من سعر البيع، لذلك:
 *   سعر التعادل = تكلفة الأساس / (1 - عمولة%)
 *   سعر البيع المقترح = تكلفة الأساس × (1 + ربح%) / (1 - عمولة%)
 */
export function calcPricing(i: PricingInputs): PricingResult {
  const baseCost = i.purchase + i.shipping + i.packaging + i.ads + i.other;
  const commissionRate = Math.min(Math.max(i.commissionPct, 0), 99.9) / 100;
  const marginRate = i.marginPct / 100;

  const breakEvenPrice = baseCost / (1 - commissionRate);
  const suggestedPrice = (baseCost * (1 + marginRate)) / (1 - commissionRate);
  const commissionValue = suggestedPrice * commissionRate;
  const totalCost = baseCost + commissionValue;
  const netProfit = suggestedPrice - totalCost;
  const marginPct = suggestedPrice > 0 ? (netProfit / suggestedPrice) * 100 : 0;
  const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    baseCost,
    totalCost,
    breakEvenPrice,
    suggestedPrice,
    commissionValue,
    netProfit,
    marginPct,
    roiPct,
  };
}

export function analyzePricing(i: PricingInputs, r: PricingResult): Analysis {
  const tips: string[] = [];
  const baseCost = r.baseCost || 1;
  const adsShare = (i.ads / baseCost) * 100;
  const shipShare = ((i.shipping + i.packaging) / baseCost) * 100;

  if (adsShare > 25) tips.push("خفض تكلفة الإعلان — تستهلك جزءاً كبيراً من التكلفة");
  if (shipShare > 30) tips.push("راجع تكاليف الشحن والتغليف أو تفاوض مع شركة الشحن");
  if (i.commissionPct > 20) tips.push("عمولة المنصة مرتفعة — فكر في البيع المباشر أو منصة أقل عمولة");

  if (r.netProfit <= 0) {
    tips.unshift("ارفع سعر البيع فوراً");
    tips.push("قلل التكاليف أو أعد التفاوض على سعر الشراء");
    return {
      status: "loss",
      label: "خسارة",
      reason: `سعر البيع (${money(r.suggestedPrice)}) لا يغطي إجمالي التكلفة (${money(
        r.totalCost,
      )}) بعد خصم العمولة، وصافي الربح ${money(r.netProfit)}.`,
      tips,
    };
  }

  if (r.marginPct < 10) {
    tips.unshift("ارفع سعر البيع أو نسبة الربح المطلوبة");
    tips.push("هامش الربح منخفض ولا يحمل أي مصاريف مفاجئة");
    return {
      status: "warning",
      label: "تحذير",
      reason: `هامش الربح ${percent(r.marginPct)} فقط و ROI ${percent(
        r.roiPct,
      )} — أي زيادة بسيطة في التكاليف تحوّل الصفقة إلى خسارة.`,
      tips,
    };
  }

  if (r.marginPct < 25 || r.roiPct < 30) {
    if (tips.length === 0) tips.push("زد نسبة الربح المطلوبة تدريجياً واختبر تفاعل العملاء");
    tips.push("راقب تكلفة الإعلان لكل عملية بيع");
    return {
      status: "good",
      label: "جيد",
      reason: `الصفقة مربحة: هامش الربح ${percent(r.marginPct)} و ROI ${percent(
        r.roiPct,
      )}، لكن ما زال هناك مجال للتحسين.`,
      tips,
    };
  }

  if (tips.length === 0) tips.push("ثبّت هذا التسعير وركز على زيادة حجم المبيعات");
  return {
    status: "excellent",
    label: "ممتاز",
    reason: `هامش ربح قوي ${percent(r.marginPct)} وعائد على التكلفة ${percent(
      r.roiPct,
    )} مع صافي ربح ${money(r.netProfit)} للوحدة.`,
    tips,
  };
}

/* ---------------------------- Profit calculator ---------------------------- */

export type ProfitResult = {
  netProfit: number;
  profitPct: number;
  marginPct: number;
  totalCost: number;
};

export function calcProfit(purchase: number, selling: number, expenses: number): ProfitResult {
  const totalCost = purchase + expenses;
  const netProfit = selling - totalCost;
  return {
    totalCost,
    netProfit,
    profitPct: totalCost > 0 ? (netProfit / totalCost) * 100 : 0,
    marginPct: selling > 0 ? (netProfit / selling) * 100 : 0,
  };
}

export function analyzeProfit(r: ProfitResult): Analysis {
  if (r.netProfit <= 0)
    return {
      status: "loss",
      label: "خسارة",
      reason: `سعر البيع أقل من إجمالي التكلفة (${money(r.totalCost)}).`,
      tips: ["ارفع سعر البيع", "قلل المصاريف"],
    };
  if (r.marginPct < 10)
    return {
      status: "warning",
      label: "تحذير",
      reason: `هامش الربح منخفض (${percent(r.marginPct)}).`,
      tips: ["ارفع سعر البيع", "راجع المصاريف التشغيلية"],
    };
  if (r.marginPct < 25)
    return {
      status: "good",
      label: "جيد",
      reason: `هامش ربح مقبول ${percent(r.marginPct)}.`,
      tips: ["حاول تحسين الهامش بزيادة بسيطة في السعر"],
    };
  return {
    status: "excellent",
    label: "ممتاز",
    reason: `هامش ربح قوي ${percent(r.marginPct)} وصافي ربح ${money(r.netProfit)}.`,
    tips: ["ركز على زيادة عدد الطلبات"],
  };
}

/* --------------------------- Discount calculator -------------------------- */

export function calcDiscount(original: number, discountPct: number) {
  const value = original * (discountPct / 100);
  return { discountValue: value, finalPrice: original - value, saved: value };
}

/* ------------------------------ VAT calculator ---------------------------- */

export function calcVat(price: number, ratePct: number, mode: "exclusive" | "inclusive") {
  const rate = ratePct / 100;
  if (mode === "inclusive") {
    const beforeVat = price / (1 + rate);
    return { beforeVat, vatValue: price - beforeVat, withVat: price };
  }
  const vatValue = price * rate;
  return { beforeVat: price, vatValue, withVat: price + vatValue };
}

/* ---------------------------- Shipping calculator ------------------------- */

export function calcShipping(shippingCost: number, orders: number) {
  const safeOrders = orders > 0 ? orders : 0;
  return {
    perOrder: safeOrders > 0 ? shippingCost : 0,
    total: shippingCost * safeOrders,
    average: safeOrders > 0 ? (shippingCost * safeOrders) / safeOrders : 0,
  };
}

/* --------------------------- Break-even calculator ------------------------ */

export function calcBreakEven(fixedCosts: number, unitCost: number, sellingPrice: number) {
  const contribution = sellingPrice - unitCost;
  const units = contribution > 0 ? fixedCosts / contribution : Infinity;
  return {
    contribution,
    units,
    unitsRounded: Number.isFinite(units) ? Math.ceil(units) : Infinity,
    revenue: Number.isFinite(units) ? Math.ceil(units) * sellingPrice : Infinity,
  };
}
