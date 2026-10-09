const TERMII_API_URL = "https://v4.api.termii.com/api/sms/send";

interface TermiiSmsResponse {
  code?: string;
  message_id?: string;
  message?: string;
  balance?: number;
  user?: string;
}

export interface SmsDeliveryResult {
  success: boolean;
  messageId?: string;
}

function getTermiiConfiguration(): {
  apiKey: string;
  senderId: string;
} {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;

  if (!apiKey || !senderId) {
    throw new Error("SMS service is not configured.");
  }

  if (
    senderId.length < 3 ||
    senderId.length > 11 ||
    !/^[A-Za-z][A-Za-z0-9]*$/.test(senderId)
  ) {
    throw new Error("SMS sender ID configuration is invalid.");
  }

  return { apiKey, senderId };
}

/**
 * Sends a SuperAdmin new-device verification code using Termii.
 *
 * SECURITY:
 * - Keep TERMII_API_KEY in the private server environment.
 * - Never return the API key or OTP to the browser.
 * - Never log the OTP or API response body.
 * - Call this function only from the server after the
 *   user's password has been verified.
 */
export async function sendSuperAdminOtpSms(
  phoneNumber: string,
  otpCode: string,
): Promise<SmsDeliveryResult> {
  if (!/^\+[1-9][0-9]{7,14}$/.test(phoneNumber)) {
    throw new Error("Recipient phone number is invalid.");
  }

  if (!/^[0-9]{6}$/.test(otpCode)) {
    throw new Error("Verification code is invalid.");
  }

  const { apiKey, senderId } = getTermiiConfiguration();

  // Termii commonly expects international numbers without
  // the leading plus sign.
  const recipient = phoneNumber.slice(1);

  const smsMessage =
    `Your Ultra Fingerprint Attendance verification code is ${otpCode}. ` +
    "It expires in 5 minutes. Do not share this code with anyone.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        to: recipient,
        from: senderId,
        sms: smsMessage,
        type: "plain",
        channel: "generic",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Do not expose the provider response or credentials.
      throw new Error("SMS provider request failed.");
    }

    const result = (await response.json()) as TermiiSmsResponse;

    if (
      typeof result.message_id !== "string" ||
      result.message_id.length === 0
    ) {
      throw new Error("SMS provider did not confirm message acceptance.");
    }

    return {
      success: true,
      messageId: result.message_id,
    };
  } catch {
    // Avoid leaking provider responses, OTPs, or credentials.
    throw new Error(
      "Unable to submit the verification SMS. Please try again later.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
