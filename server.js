import express from "express";
import * as cheerio from "cheerio";

const app = express();

app.use(express.json());
app.use(express.static("."));

function clean(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function includesAny(text = "", phrases = []) {
  const lower = text.toLowerCase();
  return phrases.some(p => lower.includes(p.toLowerCase()));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function looksLikeBrandOnly(text = "") {
  const words = clean(text).split(/\s+/).filter(Boolean);
  return words.length <= 2 && text.length <= 28;
}

function looksGenericHeadline(text = "") {
  return includesAny(text, [
    "welcome",
    "welcome to",
    "home",
    "hello",
    "we are",
    "quality you can trust",
    "your journey starts here",
    "experience the difference",
    "better together",
    "made for you"
  ]);
}

function detectBusinessType(text = "") {
  const categories = [
    {
      type: "Hair salon",
      words: [
        "hair salon",
        "hairdresser",
        "hair colour",
        "hair color",
        "hairbar",
        "hair bar",
        "salon",
        "blow dry",
        "blowdry",
        "balayage",
        "foils",
        "haircut",
        "hair cut",
        "styling",
        "hair styling",
        "colourist",
        "colorist"
      ]
    },
    {
      type: "Barber",
      words: [
        "barber",
        "barbershop",
        "fade",
        "men's haircut",
        "mens haircut",
        "beard trim"
      ]
    },
    {
      type: "Beauty / skin clinic",
      words: [
        "facial",
        "skin clinic",
        "skin treatment",
        "beauty salon",
        "beauty",
        "skin",
        "microneedling",
        "peel",
        "dermal",
        "brows",
        "lashes"
      ]
    },
    {
      type: "Massage / wellness",
      words: [
        "massage",
        "wellness",
        "remedial",
        "lymphatic",
        "body treatment"
      ]
    },
    {
      type: "Cafe",
      words: [
        "cafe",
        "coffee",
        "breakfast",
        "brunch",
        "espresso"
      ]
    },
    {
      type: "Restaurant",
      words: [
        "restaurant",
        "dinner",
        "lunch",
        "menu",
        "reservation",
        "book a table"
      ]
    },
    {
      type: "Trades / home service",
      words: [
        "plumber",
        "electrician",
        "builder",
        "landscaping",
        "landscaper",
        "painting",
        "roofing",
        "carpentry"
      ]
    },
    {
      type: "Fitness",
      words: [
        "gym",
        "fitness",
        "personal training",
        "pilates",
        "yoga",
        "strength training"
      ]
    },
    {
      type: "Professional service",
      words: [
        "accountant",
        "lawyer",
        "solicitor",
        "consulting",
        "consultant",
        "financial advice",
        "mortgage broker"
      ]
    }
  ];

  let best = {
    type: "Small business",
    score: 0
  };

  for (const category of categories) {
    let score = 0;

    for (const word of category.words) {
      if (text.toLowerCase().includes(word)) {
        score++;
      }
    }

    if (score > best.score) {
      best = {
        type: category.type,
        score
      };
    }
  }

  return best.type;
}

function detectLocation(text = "") {
  const places = [
    "Cronulla",
    "Miranda",
    "Sutherland",
    "Caringbah",
    "Gymea",
    "Woolooware",
    "Engadine",
    "Kirrawee",
    "Sydney",
    "Bondi",
    "Manly",
    "Parramatta",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide"
  ];

  for (const place of places) {
    if (text.toLowerCase().includes(place.toLowerCase())) {
      return place;
    }
  }

  return "";
}

function detectServices(text = "") {
  const serviceBank = [
    "Balayage",
    "Hair colour",
    "Haircuts",
    "Styling",
    "Blow dries",
    "Facials",
    "Skin treatments",
    "Massage",
    "Brows",
    "Lashes",
    "Remedial massage",
    "Lymphatic drainage",
    "Pilates",
    "Personal training",
    "Coffee",
    "Breakfast",
    "Brunch",
    "Plumbing",
    "Electrical",
    "Landscaping",
    "Consulting"
  ];

  const matches = [];

  for (const service of serviceBank) {
    if (text.toLowerCase().includes(service.toLowerCase())) {
      matches.push(service);
    }
  }

  return unique(matches).slice(0, 4);
}

function chooseCTA(type, text = "") {
  if (
    type === "Hair salon" ||
    type === "Barber" ||
    type === "Beauty / skin clinic" ||
    type === "Massage / wellness" ||
    type === "Fitness"
  ) {
    return "Book an appointment";
  }

  if (type === "Restaurant") {
    return "Book a table";
  }

  if (type === "Trades / home service") {
    return "Get a quote";
  }

  if (type === "Professional service") {
    return "Book a consultation";
  }

  if (includesAny(text, ["shop", "buy now", "add to cart"])) {
    return "Shop now";
  }

  return "Get in touch";
}

function buildHeadline(business, type, location, services) {
  const place = location ? ` in ${location}` : "";

  if (type === "Hair salon") {
    let offer = services.length
      ? services.slice(0, 3).join(", ")
      : "colour, cuts and styling";

    return `${business} — ${offer.toLowerCase()}${place}.`;
  }

  if (type === "Barber") {
    return `${business} — modern cuts, fades and grooming${place}.`;
  }

  if (type === "Beauty / skin clinic") {
    return `${business} — personalised skin and beauty treatments${place}.`;
  }

  if (type === "Massage / wellness") {
    return `${business} — massage and wellness treatments designed around you${place}.`;
  }

  if (type === "Fitness") {
    return `${business} — practical training to help you move and feel better${place}.`;
  }

  if (type === "Cafe") {
    return `${business} — coffee, food and an easy reason to come back${place}.`;
  }

  if (type === "Restaurant") {
    return `${business} — memorable food and relaxed dining${place}.`;
  }

  if (type === "Trades / home service") {
    return `${business} — reliable local service${place}, without the runaround.`;
  }

  if (type === "Professional service") {
    return `${business} — straightforward advice and expert support${place}.`;
  }

  return `${business} — make the value clear from the first screen.`;
}

app.post("/api/analyse", async (req, res) => {
  try {
    let { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "Please enter a website URL."
      });
    }

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    let response;

    try {
      response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        }
      });
    } catch {
      return res.status(400).json({
        error: "That website could not be reached."
      });
    }

    if (!response.ok) {
      return res.status(400).json({
        error:
          "This website could not be analysed. It may block automated access or require a login."
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, noscript, svg, iframe").remove();

    const title = clean($("title").first().text());

    const h1s = $("h1")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const h2s = $("h2")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const headings = $("h1, h2, h3")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const links = $("a")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const buttons = $("button")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const paragraphs = $("p")
      .map((i, el) => clean($(el).text()))
      .get()
      .filter(Boolean);

    const bodyText = clean($("body").text());

    const wordCount =
      bodyText.split(/\s+/).filter(Boolean).length;

    const actionText =
      [...links, ...buttons].join(" ");

    const strengths = [];
    const issues = [];

    let score = 50;

    const ctaWords = [
      "book",
      "contact",
      "enquire",
      "inquire",
      "get started",
      "shop",
      "call",
      "schedule",
      "appointment",
      "quote",
      "apply",
      "sign up"
    ];

    const trustWords = [
      "review",
      "reviews",
      "testimonial",
      "trusted",
      "years",
      "award",
      "certified",
      "qualified",
      "licensed",
      "clients",
      "rated",
      "experience",
      "results"
    ];

    if (h1s.length === 1) {
      score += 8;
      strengths.push("The homepage has one clear main heading.");
    } else if (h1s.length === 0) {
      score -= 12;
      issues.push(
        "The homepage does not appear to have a clear main H1 heading."
      );
    } else {
      score -= 5;
      issues.push(
        "The homepage uses multiple H1 headings, which can weaken the main message."
      );
    }

    if (h1s[0]) {
      if (looksLikeBrandOnly(h1s[0])) {
        score -= 2;
        issues.push(
          `The main heading (“${h1s[0]}”) reads more like a brand label than a value proposition.`
        );
      } else if (looksGenericHeadline(h1s[0])) {
        score -= 7;
        issues.push(
          "The main heading feels generic and could explain the customer benefit more clearly."
        );
      } else {
        score += 5;
        strengths.push(
          "The main heading provides useful context."
        );
      }
    }

    const shortParagraphs =
      paragraphs.filter(
        p => p.length >= 30 && p.length <= 220
      );

    if (shortParagraphs.length) {
      score += 5;
      strengths.push(
        "The homepage includes supporting copy that helps explain the offer."
      );
    } else {
      score -= 4;
      issues.push(
        "There is little supporting copy near the main message."
      );
    }

    const matchedCtas =
      unique(
        [...links, ...buttons].filter(text =>
          includesAny(text, ctaWords)
        )
      );

    if (matchedCtas.length >= 1 && matchedCtas.length <= 4) {
      score += 10;
      strengths.push(
        "The site includes a clear action for visitors to take."
      );
    } else if (matchedCtas.length > 4) {
      score += 4;
      issues.push(
        "The homepage has several competing calls to action."
      );
    } else {
      score -= 12;
      issues.push(
        "There is no obvious primary call to action."
      );
    }

    if (includesAny(bodyText, trustWords)) {
      score += 7;
      strengths.push(
        "The homepage includes trust signals or proof."
      );
    } else {
      score -= 6;
      issues.push(
        "Trust signals are not obvious. Reviews, experience or proof could help."
      );
    }

    if (wordCount > 2200) {
      score -= 8;
      issues.push(
        "The homepage contains a lot of text and could be easier to scan."
      );
    } else if (wordCount >= 200 && wordCount <= 1400) {
      score += 5;
      strengths.push(
        "The amount of homepage copy is within a reasonable range."
      );
    }

    if (headings.length >= 3 && headings.length <= 14) {
      score += 5;
      strengths.push(
        "The page is broken into scannable sections."
      );
    }

    if (issues.length >= 3) {
      score = Math.min(score, 84);
    }

    score = clamp(score, 20, 92);

    let domainText = "";

    try {
      domainText = new URL(url)
        .hostname
        .replace("www.", "")
        .replace(/\.(com|com\.au|net|net\.au|org|org\.au|co|io)$/i, "")
        .replace(/[-_]/g, " ");
    } catch {}

    const identityText =
      `${title} ${domainText} ${h1s.join(" ")} ${bodyText}`;

    const businessType =
      detectBusinessType(identityText);

    const location =
      detectLocation(identityText);

    const services =
      detectServices(identityText);

    const suggestedCTA =
      chooseCTA(
        businessType,
        bodyText
      );

    let siteName = title;

    if (!siteName) {
      siteName =
        new URL(url)
          .hostname
          .replace("www.", "");
    }

    siteName =
      siteName
        .replace(/\s*[|–—-]\s*.+$/, "")
        .trim();

    const suggestedHeadline =
      buildHeadline(
        siteName,
        businessType,
        location,
        services
      );

    const suggestedSubhead =
      services.length
        ? `Explore ${services.slice(0,3).join(", ").toLowerCase()} with a clear, simple path to ${suggestedCTA.toLowerCase()}.`
        : `A clearer introduction to what ${siteName} offers, who it helps and what to do next.`;

    const opportunity =
      issues[0] ||
      "Make the value proposition easier to understand within the first few seconds.";

    const structure = [
      {
        title: "Hero",
        description:
          `${suggestedHeadline} Add one short supporting sentence and the CTA “${suggestedCTA}”.`
      },
      {
        title: "Services",
        description:
          services.length
            ? `Feature the core offers first: ${services.join(", ")}.`
            : "Show the main services in simple customer-friendly language."
      },
      {
        title: "Proof",
        description:
          "Add reviews, results, credentials or other reasons to trust the business."
      },
      {
        title: "Why choose you",
        description:
          "Explain what makes the experience different in specific, human language."
      },
      {
        title: "How it works",
        description:
          "Show the next step clearly so visitors know exactly what happens after they enquire or book."
      },
      {
        title: "Final CTA",
        description:
          `Finish with one clear invitation: “${suggestedCTA}”.`
      }
    ];

    res.json({
      siteName,
      score,
      strengths: unique(strengths).slice(0,5),
      issues: unique(issues).slice(0,5),
      headlineAdvice:
        suggestedHeadline,
      ctaAdvice:
        suggestedCTA,
      opportunity,
      structure,

      businessType,
      location,
      services,
      suggestedHeadline,
      suggestedSubhead,
      suggestedCTA
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Something went wrong while analysing this website."
    });
  }
});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Plainspoken V3 is running at http://localhost:${PORT}`
  );
});
