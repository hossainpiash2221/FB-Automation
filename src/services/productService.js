const { getSheetData } = require("./googleSheets");

function parsePrice(value) {
  if (value === null || value === undefined || String(value).trim() === "") return 0;
  const normalized = String(value).replace(/,/g, "").replace(/[^\d.]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function findProduct(productCode) {
  const code = String(productCode || "").trim().toUpperCase();
  if (!/^P\d{3,}$/.test(code)) return null;

  const { products } = await getSheetData();
  const row = products.find(item =>
    String(item["Product ID"] || "").trim().toUpperCase() === code
  );
  if (!row) return null;

  const regularPrice = parsePrice(row["Old Price"]);
  const offerPrice = parsePrice(row["Price"]);
  const hasDiscount = regularPrice > 0 && offerPrice > 0 && regularPrice > offerPrice;
  const discount = hasDiscount ? Math.round(((regularPrice - offerPrice) / regularPrice) * 100) : 0;

  return {
    code: row["Product ID"],
    name: row["Product Name"] || "",
    gender: row["Gender"] || "",
    category: row["Category"] || "",
    regularPrice,
    offerPrice,
    discount,
    hasDiscount,
    description: cleanDescription(row["Description"]),
    stock: row["Stock (Remaining, auto)"] || "",
    status: row["Status"] || "",
    image1: row["Image 1"] || "",
    image2: row["Image 2"] || "",
    image3: row["Image 3"] || ""
  };
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

// Fixed template: only values from the Sheet are dynamic.
function formatProductMessage(product) {
  const priceBlock = product.hasDiscount
    ? `💰 Regular Price: ৳${formatPrice(product.regularPrice)}\n\n🔥 Offer Price: ৳${formatPrice(product.offerPrice)}\n\n🎉 Discount: ${product.discount}% OFF`
    : `💰 Price: ৳${formatPrice(product.offerPrice)}`;

  return `🌟 ${product.name}

🏷️ Product Code: ${product.code}

${priceBlock}

📝 Product Details:
${product.description || "বিস্তারিত জানতে আমাদের ইনবক্স করুন।"}

━━━━━━━━━━━━━━━━━━

🛒 অর্ডার করতে চাইলে নিচের তথ্যগুলো দিন:

1️⃣ Product Code: ${product.code}
2️⃣ Customer Name:
3️⃣ Phone Number:
4️⃣ Full Delivery Address:

❤️ আপনার অর্ডারটি নিশ্চিত করতে আমাদের তথ্যগুলো পাঠিয়ে দিন।

ধন্যবাদ আমাদের সাথে থাকার জন্য।`;
}

function formatPriceOnly(product) {
  if (product.hasDiscount) {
    return `🌟 ${product.name}\n\n🏷️ Product Code: ${product.code}\n\n💰 Regular Price: ৳${formatPrice(product.regularPrice)}\n🔥 Offer Price: ৳${formatPrice(product.offerPrice)}\n🎉 Discount: ${product.discount}% OFF`;
  }
  return `🌟 ${product.name}\n\n🏷️ Product Code: ${product.code}\n\n💰 Price: ৳${formatPrice(product.offerPrice)}`;
}

function formatDescriptionOnly(product) {
  return `🌟 ${product.name}\n\n🏷️ Product Code: ${product.code}\n\n📝 Product Details:\n${product.description || "বিস্তারিত জানতে আমাদের ইনবক্স করুন।"}`;
}

module.exports = {
  findProduct,
  formatProductMessage,
  formatPriceOnly,
  formatDescriptionOnly,
  parsePrice,
  cleanDescription
};
