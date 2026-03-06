import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend =
  resendApiKey && resendApiKey.length > 0
    ? new Resend(resendApiKey)
    : undefined;

