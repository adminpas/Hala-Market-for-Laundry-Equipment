export type PaymentMethod = "mada" | "apple_pay" | "bank_transfer";
export type PaymentState = "pending" | "test" | "paid" | "failed" | "refunded";

export function paymentMode() {
  return process.env.PAYMENT_GATEWAY_MODE === "live" ? "live" : "test";
}

export function paymentProvider() {
  return process.env.PAYMENT_PROVIDER?.trim() || "";
}

export function paymentReadiness() {
  const mode = paymentMode();
  const provider = paymentProvider();
  const hasKey = !!process.env.PAYMENT_API_KEY;
  // A provider adapter must be explicitly named before live collection is accepted.
  const supportedAdapter = ["moyasar", "hyperpay"].includes(provider.toLowerCase());
  return {
    mode,
    provider,
    hasKey,
    supportedAdapter,
    live: mode === "live" && hasKey && supportedAdapter,
  };
}

export function createPaymentIntent(input: {
  method: PaymentMethod;
  amount: number;
  referencePrefix: string;
}) {
  const readiness = paymentReadiness();

  if (input.method === "bank_transfer") {
    return {
      allowed: true,
      status: "pending" as PaymentState,
      provider: "bank_transfer",
      reference: `BANK-${input.referencePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      message: "تم إنشاء طلب تحويل بنكي بانتظار تحقق الإدارة من وصول المبلغ.",
      testMode: false,
    };
  }

  if (!readiness.live) {
    return {
      allowed: readiness.mode === "test",
      status: "test" as PaymentState,
      provider: "test",
      reference: `TEST-${input.referencePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      message: "هذه معاملة اختبار فقط؛ لم تُخصم أموال ولم تُبع القطعة.",
      testMode: true,
    };
  }

  // Safety gate: provider credentials may exist, but this project must not claim
  // live collection until the provider-specific server callback is implemented.
  return {
    allowed: false,
    status: "pending" as PaymentState,
    provider: readiness.provider,
    reference: "",
    message: `بوابة ${readiness.provider} مهيأة جزئياً، لكن Adapter التأكيد الحي وWebhook لم يُفعّلا بعد.`,
    testMode: false,
  };
}
