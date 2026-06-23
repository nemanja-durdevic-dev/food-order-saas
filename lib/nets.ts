import "server-only";

const NETS_BASE_URL =
  process.env.NETS_ENVIRONMENT === "production"
    ? "https://api.dibspayment.eu"
    : "https://test.api.dibspayment.eu";

const secretKey = process.env.NETS_SECRET_KEY ?? "";

const isConfigured = Boolean(secretKey);

type NetsCreatePaymentParams = {
  amount: number;
  currency: string;
  reference: string;
  items: Array<{
    reference: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    grossTotalAmount: number;
    netTotalAmount: number;
    taxAmount?: number;
    taxRate?: number;
  }>;
  returnUrl: string;
  cancelUrl: string;
  termsUrl: string;
  webhookUrl: string;
};

export type NetsCreatePaymentResult = {
  paymentId: string;
  hostedPaymentPageUrl: string;
};

export async function createPayment(
  params: NetsCreatePaymentParams,
): Promise<NetsCreatePaymentResult> {
  const body = {
    order: {
      items: params.items,
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      reference: params.reference,
    },
    checkout: {
      integrationType: "HostedPaymentPage",
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      termsUrl: params.termsUrl,
      charge: true,
    },
    notifications: {
      webhooks: [
        {
          eventName: "payment.reservation.created",
          url: params.webhookUrl,
        },
        {
          eventName: "payment.reservation.failed",
          url: params.webhookUrl,
        },
        {
          eventName: "payment.charge.created",
          url: params.webhookUrl,
        },
      ],
    },
  };

  const res = await fetch(`${NETS_BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: secretKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NETS create payment failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<NetsCreatePaymentResult>;
}

type NetsPaymentStatus = {
  paymentId: string;
  order: {
    amount: number;
    currency: string;
    reference: string;
  };
  summary: {
    reservedAmount: number;
    chargedAmount: number;
    cancelledAmount: number;
    refundedAmount: number;
  };
  state: string;
};

export async function getPayment(paymentId: string): Promise<NetsPaymentStatus> {
  const res = await fetch(`${NETS_BASE_URL}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: secretKey,
    },
  });

  if (!res.ok) {
    throw new Error(`NETS get payment failed (${res.status})`);
  }

  const data = (await res.json()) as NetsPaymentStatus & { payment?: { state: string } };

  return {
    ...data,
    state: data.payment?.state ?? data.state,
  };
}

export { isConfigured as isNetsConfigured };
