const {
  findProduct,
  formatProductMessage,
  formatPriceOnly,
  formatDescriptionOnly
} = require("../services/productService");
const { findFaq, normalize } = require("../services/faqService");

function extractProductCodes(message) {
  const matches = String(message || "").match(/\bP\d{3,}\b/gi) || [];
  return [...new Set(matches.map(code => code.toUpperCase()))];
}

function isActive(product) {
  return String(product.status || "").trim().toLowerCase() === "active";
}

function detectProductIntent(message) {
  const text = normalize(message);
  const priceWords = ["price", "dam", "dum", "দাম", "মূল্য", "koto", "কত"];
  const descriptionWords = ["description", "details", "detail", "বিস্তারিত", "বর্ণনা"];
  const codeWords = ["code", "কোড"];

  if (descriptionWords.some(word => text.includes(normalize(word)))) return "DESCRIPTION";
  if (priceWords.some(word => text.includes(normalize(word)))) return "PRICE";
  if (codeWords.some(word => text.includes(normalize(word)))) return "CODE";
  return "FULL";
}

async function processCustomerMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    return { status: "invalid_message", reply: "অনুগ্রহ করে আপনার প্রশ্নটি লিখুন।" };
  }

  const codes = extractProductCodes(message);

  // Product code has priority when present.
  if (codes.length) {
    const intent = detectProductIntent(message);
    const replies = [];

    for (const code of codes) {
      try {
        const product = await findProduct(code);

        if (!product) {
          replies.push(`দুঃখিত, ${code} Product Code-এর তথ্য পাওয়া যায়নি।`);
          continue;
        }

        if (!isActive(product)) {
          replies.push(`দুঃখিত, ${code} বর্তমানে Available নেই।`);
          continue;
        }

        if (intent === "PRICE") replies.push(formatPriceOnly(product));
        else if (intent === "DESCRIPTION") replies.push(formatDescriptionOnly(product));
        else replies.push(formatProductMessage(product));
      } catch (error) {
        console.error(`Product ${code} error:`, error.message);
        replies.push(`দুঃখিত, ${code} Product-এর তথ্য আনতে সমস্যা হয়েছে। একটু পরে চেষ্টা করুন।`);
      }
    }

    return {
      status: "success",
      intent: `PRODUCT_${intent}`,
      productCodes: codes,
      reply: replies.join("\n\n━━━━━━━━━━━━━━━━━━\n\n")
    };
  }

  const faq = findFaq(message);
  if (faq) {
    return { status: "success", intent: faq.intent, productCodes: [], reply: faq.reply };
  }

  return {
    status: "needs_clarification",
    intent: "UNKNOWN",
    productCodes: [],
    reply: "আপনি কোন Product বা কোন তথ্য জানতে চাচ্ছেন, একটু বিস্তারিত লিখবেন?"
  };
}

module.exports = {
  extractProductCodes,
  processCustomerMessage,
  detectProductIntent
};
