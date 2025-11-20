// generate_rag_index.js
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { parseStringPromise } = require("xml2js");

// Config
const BASE_URL = "http://localhost:3000/metiz-docs";
const LANGUAGES = ["en", "de", "sl", "pl"]; // Add all languages here
const LMSTUDIO_EMBED_URL = "http://localhost:1234/v1/embeddings";
const EMBEDDING_MODEL = "embeddinggemma-300M-GGUF"; // Replace with your embedding model

// Remove HTML, menus, navs — extract only page-readable text
function extractCleanText(html) {
  const $ = cheerio.load(html);
  $("nav, header, footer, script, style").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Fetch and embed a single document
async function embedDocument(url) {
  console.log(`📄 Fetching ${url}`);
  const html = await axios.get(url).then((res) => res.data);
  const text = extractCleanText(html);

  console.log(`🤖 Embedding text (${text.length} chars)...`);
  const embedRes = await axios.post(LMSTUDIO_EMBED_URL, {
    input: text,
    model: EMBEDDING_MODEL,
  });

  return {
    url,
    text,
    embedding: embedRes.data.data[0].embedding,
  };
}

// Filter URLs to only current version
function isCurrentVersion(url, lang) {
  let relative = url.replace(/^http:\/\/localhost:3000\/metiz-docs/, "");

  if (lang === "en") {
    // English: no version folder
    return !relative.startsWith("/0.") && !relative.startsWith("/next");
  }

  // Other languages: remove /<lang> prefix
  if (relative.startsWith(`/${lang}/`)) {
    relative = relative.replace(`/${lang}`, "");
  }

  // Keep only URLs without version folder
  return !/^\/(0\.\d+|next)/.test(relative);
}

(async () => {
  const results = [];

  for (const lang of LANGUAGES) {
    const sitemapUrl =
      lang === "en"
        ? `${BASE_URL}/sitemap.xml`
        : `${BASE_URL}/${lang}/sitemap.xml`;

    console.log("📥 Downloading sitemap:", sitemapUrl);

    let sitemapXml;
    try {
      sitemapXml = await axios.get(sitemapUrl).then((res) => res.data);
    } catch (err) {
      console.error("❌ Failed to fetch sitemap:", sitemapUrl, err.message);
      continue;
    }

    // Parse XML
    const parsed = await parseStringPromise(sitemapXml);
    const urls = parsed.urlset.url.map((u) => u.loc[0]);
    console.log(`🔎 Found ${urls.length} pages in sitemap (${lang})`);

    // Filter only current version URLs
    const currentUrls = urls.filter((url) => isCurrentVersion(url, lang));
    console.log(`✅ Using ${currentUrls.length} pages (current version only)`);

    // Embed pages
    for (const url of currentUrls) {
      try {
        const doc = await embedDocument(url);
        results.push(doc);
      } catch (err) {
        console.error("❌ Error on", url, err.message);
      }
    }
  }

  // Save final vector index
  fs.writeFileSync("rag_index.json", JSON.stringify(results, null, 2));
  console.log(
    "🎉 Done! Generated rag_index.json with current version docs only."
  );
})();
