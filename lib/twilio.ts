import "server-only";

import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const isConfigured = Boolean(accountSid && authToken);

export const twilioClient = isConfigured ? Twilio(accountSid, authToken) : null;

export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ?? "";
