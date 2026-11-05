async function sendMessengerMessage(recipientId, message) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const version = process.env.GRAPH_API_VERSION || "v25.0";

  if (!token || !pageId) {
    throw new Error("META_PAGE_ACCESS_TOKEN or META_PAGE_ID is missing");
  }

  const url = `https://graph.facebook.com/${version}/${pageId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text: String(message).slice(0, 2000) }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Messenger API error:", data);
    throw new Error(data.error?.message || "Messenger send failed");
  }

  return data;
}

module.exports = { sendMessengerMessage };
