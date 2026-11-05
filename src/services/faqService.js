const faqs = require("../data/faqs.json");

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[০-৯]/g, digit => "০১২৩৪৫৬৭৮৯".indexOf(digit))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findFaq(message) {
  const normalizedMessage = normalize(message);
  if (!normalizedMessage) return null;

  for (const [intent, faq] of Object.entries(faqs)) {
    if (!faq.enabled) continue;

    for (const keyword of faq.keywords || []) {
      const normalizedKeyword = normalize(keyword);
      if (normalizedKeyword && normalizedMessage.includes(normalizedKeyword)) {
        return { intent, reply: faq.reply };
      }
    }
  }

  return null;
}

module.exports = { findFaq, normalize };
