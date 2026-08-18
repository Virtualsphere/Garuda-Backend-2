const MYOPERATOR_URL = "https://obd-api.myoperator.co/obd-api-v1";
const MYOPERATOR_USERS_URL = "https://developers.myoperator.co/user";

// type "1" = User Dialer: MyOperator calls `number`, bridging it to the MyOperator user identified by `user_id`.
const USER_DIALER = "1";

const toIndianE164 = (rawNumber) => {
  const digits = String(rawNumber).replace(/\D/g, "").slice(-10);
  return `+91${digits}`;
};

// Agents must already be registered as MyOperator Users (dashboard → Invite teammates).
// We resolve their MyOperator user_id by matching phone number, rather than storing it separately.
const resolveAgentUserId = async (agentNumber, usersToken) => {
  const digits = String(agentNumber).replace(/\D/g, "").slice(-10);
  const url = new URL(MYOPERATOR_USERS_URL);
  url.searchParams.set("token", usersToken);
  url.searchParams.set("keyword", digits);

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data?.status !== "success") {
    throw new Error(data?.details || data?.message || data?.error || "Failed to look up MyOperator user");
  }

  const match = data.data?.find((u) => u.contact_number === digits);
  if (!match) {
    throw new Error(`Agent number ${agentNumber} is not registered as a MyOperator user`);
  }
  return match.uuid;
};

export const clickToCall = async ({ agentNumber, customerNumber, referenceId }) => {
  const companyId = process.env.MYOPERATOR_COMPANY_ID;
  const apiKey = process.env.MYOPERATOR_API_KEY;
  const secretToken = process.env.MYOPERATOR_SECRET_TOKEN;
  const publicIvrId = process.env.MYOPERATOR_PUBLIC_IVR_ID;
  const usersToken = process.env.MYOPERATOR_USERS_TOKEN;

  if (!companyId || !apiKey || !secretToken || !publicIvrId || !usersToken) {
    throw new Error("MyOperator credentials are not configured");
  }

  const userId = await resolveAgentUserId(agentNumber, usersToken);

  const response = await fetch(MYOPERATOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      company_id: companyId,
      secret_token: secretToken,
      type: USER_DIALER,
      number: toIndianE164(customerNumber),
      user_id: userId,
      public_ivr_id: publicIvrId,
      reference_id: referenceId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.details || data?.message || "MyOperator call request failed");
  }

  return data;
};
