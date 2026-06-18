import "server-only";

const VIPPS_BASE_URL =
  process.env.VIPPS_ENVIRONMENT === "production"
    ? "https://api.vipps.no"
    : "https://apitest.vipps.no";

const clientId = process.env.VIPPS_CLIENT_ID ?? "";
const clientSecret = process.env.VIPPS_CLIENT_SECRET ?? "";
const subscriptionKey = process.env.VIPPS_SUBSCRIPTION_KEY ?? "";
const merchantSerialNumber = process.env.VIPPS_MERCHANT_SERIAL ?? "";

const isConfigured = Boolean(clientId && clientSecret && subscriptionKey && merchantSerialNumber);

type VippsTokenResponse = {
  access_token: string;
  expires_in: string;
  token_type: string;
};

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${VIPPS_BASE_URL}/accessToken/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      client_id: clientId,
      client_secret: clientSecret,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Merchant-Serial-Number": merchantSerialNumber,
    },
  });

  if (!res.ok) {
    throw new Error(`Vipps token request failed: ${res.status}`);
  }

  const data = (await res.json()) as VippsTokenResponse;
  return data.access_token;
}

export type VippsCreatePaymentParams = {
  amount: number;
  reference: string;
  returnUrl: string;
  phoneNumber?: string;
};

export type VippsCreatePaymentResult = {
  aggregation: {
    authorizedAmount: { currency: string; value: number };
    cancelledAmount: { currency: string; value: number };
    capturedAmount: { currency: string; value: number };
    refundedAmount: { currency: string; value: number };
  };
  amount: { currency: string; value: number };
  state: string;
  paymentMethod: { type: string };
  pspReference: string;
  redirectUrl: string;
  reference: string;
};

export async function createPayment(
  params: VippsCreatePaymentParams,
): Promise<VippsCreatePaymentResult> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    amount: {
      currency: "NOK",
      value: Math.round(params.amount * 100),
    },
    reference: params.reference,
    paymentMethod: {
      type: "WALLET",
    },
    returnUrl: params.returnUrl,
    userFlow: "WEB_REDIRECT",
    paymentDescription: "Food order",
  };

  if (params.phoneNumber) {
    body.customer = { phoneNumber: params.phoneNumber };
  }

  const res = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Idempotency-Key": crypto.randomUUID(),
      "Merchant-Serial-Number": merchantSerialNumber,
      "Vipps-System-Name": "firebite",
      "Vipps-System-Version": "1.0.0",
      "Vipps-System-Plugin-Name": "firebite-webapp",
      "Vipps-System-Plugin-Version": "1.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vipps create payment failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as VippsCreatePaymentResult;

  return data;
}

export async function getPaymentStatus(reference: string) {
  const token = await getAccessToken();

  const res = await fetch(`${VIPPS_BASE_URL}/epayment/v1/payments/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Merchant-Serial-Number": merchantSerialNumber,
    },
  });

  if (!res.ok) {
    throw new Error(`Vipps get payment failed (${res.status})`);
  }

  return (await res.json()) as {
    state: string;
    reference: string;
    amount: { currency: string; value: number };
    aggregate: {
      authorizedAmount: { currency: string; value: number };
      capturedAmount: { currency: string; value: number };
    };
  };
}

export async function forceApprovePayment(reference: string, phoneNumber: string, token: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${VIPPS_BASE_URL}/epayment/v1/test/payments/${reference}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Merchant-Serial-Number": merchantSerialNumber,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      customer: { phoneNumber },
      token,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vipps force approve failed (${res.status}): ${text}`);
  }

  return res.json();
}

export { isConfigured as isVippsConfigured };
