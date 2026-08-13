const MYOPERATOR_URL = "https://obd-api.myoperator.co/obd-api-v1";

// type "1" = peer-to-peer dial: MyOperator rings `number` first, then bridges `number_2` once answered.
const PEER_TO_PEER = "1";

export const clickToCall = async ({ agentNumber, customerNumber, referenceId }) => {
  const companyId = process.env.MYOPERATOR_COMPANY_ID;
  const apiKey = process.env.MYOPERATOR_API_KEY;
  const secretToken = process.env.MYOPERATOR_SECRET_TOKEN;

  if (!companyId || !apiKey || !secretToken) {
    throw new Error("MyOperator credentials are not configured");
  }

  const response = await fetch(MYOPERATOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      company_id: companyId,
      secret_token: secretToken,
      type: PEER_TO_PEER,
      number: agentNumber,
      number_2: customerNumber,
      reference_id: referenceId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "MyOperator call request failed");
  }

  return data;
};
