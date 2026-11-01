/**
 * Unified AI service for the whole platform.
 * Uses a real LLM when an API key exists, otherwise falls back to a
 * deterministic domain-expert engine so every feature keeps working offline.
 */
export type AiTask =
  | "describe"      // generate marketing description + features for a machine
  | "diagnose"      // diagnose a laundry machine fault
  | "recommend"     // recommend equipment for a laundry profile
  | "chat"          // general assistant
  | "summarize";    // summarize admin data

export type AiResult = { text: string; bullets?: string[]; source: "llm" | "engine" };

const KEY = () => process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";

const SYSTEM = `أنت مساعد ذكي خبير في معدات المغاسل الصناعية تعمل لدى "شركة النجيب المتطورة لمعدات المغاسل" في جدة، السعودية.
تجيب دائماً بالعربية الفصحى المبسطة، بإيجاز ومهنية، وتذكر الأرقام والمواصفات الفنية عند الحاجة.
الأسعار بالريال السعودي. لا تختلق معلومات غير مؤكدة.`;

async function callLLM(prompt: string): Promise<string | null> {
  const key = KEY();
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 700,
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/** Per-section expert knowledge so the assistant answers in context. */
export const SECTION_EXPERT: Record<string, { name: string; tips: string[]; ask: string[] }> = {
  washers: {
    name: "الغسالات",
    tips: [
      "اختر السعة بقاعدة: وزن الغسيل اليومي ÷ 3 دورات = سعة الماكينة المطلوبة",
      "الـ Soft Mount لا يحتاج قاعدة خرسانية ويصلح للأدوار العلوية",
      "سرعة العصر G-Force 350+ تقلل زمن التجفيف وتوفر 20% من فاتورة الغاز",
    ],
    ask: ["ما السعة المناسبة لمغسلة 200 كجم يومياً؟", "ما الفرق بين Soft Mount و Hard Mount؟"],
  },
  dryers: {
    name: "النشافات",
    tips: [
      "القاعدة الذهبية: سعة النشافة = 1.3 ضعف سعة الغسالة لتفادي الاختناق",
      "حساس الرطوبة الأوتوماتيكي يوفر حتى 25% طاقة مقابل المؤقت اليدوي",
      "مجرى العادم يجب ألا يتجاوز 6 أمتار وإلا تنخفض الكفاءة",
    ],
    ask: ["نشافة غاز أم كهرباء أوفر؟", "ما سعة النشافة المناسبة لغسالة 50 كجم؟"],
  },
  carpet: {
    name: "خطوط السجاد",
    tips: [
      "الخط المتكامل: غسيل + عصر + تجفيف — العصارة تقلل زمن التجفيف 60%",
      "احسب الإنتاجية بالمتر المربع/ساعة وليس بالكيلوجرام",
      "نافضة الغبار قبل الغسيل تطيل عمر الفرش وتحسن النتيجة",
    ],
    ask: ["ما مكونات خط سجاد متكامل؟", "كم متر مربع ينتج الخط في الساعة؟"],
  },
  presses: {
    name: "المكابس",
    tips: [
      "مكبس القمصان يرفع الإنتاجية 4 أضعاف مقابل الكي اليدوي",
      "المقاس بالبوصة = عرض سطح الكبس، اختره حسب نوع القطع",
      "ضغط البخار المثالي 5-6 بار لتشطيب احترافي",
    ],
    ask: ["مكبس قمصان أم مانجل أفضل لمغسلتي؟", "كم إنتاجية مكبس البناطيل؟"],
  },
  boilers: {
    name: "المراجل والغلايات",
    tips: [
      "احسب الإنتاجية: مجموع استهلاك المعدات من البخار × 1.25 هامش أمان",
      "الغلاية الكهربائية بلا مداخن لكن تكلفة تشغيلها أعلى من الديزل",
      "معالجة المياه إلزامية — الترسبات الجيرية تقتل الغلاية خلال سنتين",
    ],
    ask: ["ما حجم الغلاية المناسب لـ 3 مكابس؟", "غلاية ديزل أم كهرباء؟"],
  },
  belts: {
    name: "السيور المتحركة",
    tips: [
      "السير يقلل العمالة 40% ويمنع سقوط الغسيل على الأرض",
      "اختر السرعة المتغيرة لمزامنة السير مع سرعة المكواة",
      "الحمولة لكل متر يجب أن تتجاوز أثقل حمولة متوقعة بـ 30%",
    ],
    ask: ["ما طول السير المناسب لمغسلتي؟", "كيف أزامن السير مع المكواة؟"],
  },
};

/* ---------- offline domain engine ---------- */

const FAULTS: { keys: string[]; cause: string; fix: string; part: string; urgency: string }[] = [
  { keys: ["e23", "لا تصرف", "تصريف", "ماء راكد"], cause: "انسداد مضخة التصريف أو فلتر الوبر", fix: "تنظيف الفلتر والمضخة وفحص خرطوم التصريف من الانحناء", part: "مضخة تصريف", urgency: "متوسطة" },
  { keys: ["تسريب", "تسرب", "ماء تحت"], cause: "تلف جلدة الباب أو وصلة خرطوم مرتخية", fix: "استبدال الجلدة وإحكام الكلبسات وفحص خزان الصابون", part: "جلدة باب", urgency: "عالية" },
  { keys: ["اهتزاز", "رجّة", "صوت عالي"], cause: "تآكل البلّي أو عدم استواء القواعد أو حمولة غير متزنة", fix: "معايرة القواعد، فحص البلّي والصلبة، وضبط نظام التعليق", part: "طقم بلّي", urgency: "عالية" },
  { keys: ["لا تسخن", "تسخين", "بارد", "حرارة"], cause: "عطل سخان أو حساس حرارة أو كونتاكتور", fix: "قياس مقاومة السخان واستبدال الحساس/الكونتاكتور", part: "سخان + حساس", urgency: "متوسطة" },
  { keys: ["لا تدور", "المحرك", "لا تعمل", "لا تشتغل"], cause: "تلف سير أو عطل إنفرتر/كاربون المحرك", fix: "فحص السير والإنفرتر وقياس ملفات المحرك", part: "سير / إنفرتر", urgency: "عالية" },
  { keys: ["لوحة", "شاشة", "كمبيوتر", "لا تستجيب"], cause: "عطل بطاقة التحكم أو تذبذب الجهد الكهربائي", fix: "فحص مصدر الجهد وتركيب منظم، وبرمجة/استبدال البوردة", part: "بطاقة تحكم", urgency: "عالية" },
  { keys: ["بخار", "ضغط", "غلاية", "غلاّية"], cause: "تسريب صمام أمان أو ترسبات جيرية في الوعاء", fix: "معايرة صمام الأمان وغسيل كيميائي للترسبات وفحص مضخة التغذية", part: "صمام أمان", urgency: "عاجلة" },
  { keys: ["مكبس", "كبس", "ذراع"], cause: "ضعف ضغط الهواء أو تلف اسطوانة نيوماتيك", fix: "فحص الكمبروسر والفلاتر واستبدال الجوانات", part: "اسطوانة هواء", urgency: "متوسطة" },
];

function engineDiagnose(input: string): AiResult {
  const t = input.toLowerCase();
  const hit = FAULTS.find((f) => f.keys.some((k) => t.includes(k)));
  if (!hit) {
    return {
      source: "engine",
      text: "لم أتعرف على العطل بدقة من الوصف. يُنصح بفحص ميداني من فني معتمد.",
      bullets: [
        "تأكد من استقرار الجهد الكهربائي ووجود أرضي سليم",
        "افحص فلتر الوبر وخراطيم الدخول والتصريف",
        "دوّن رمز الخطأ الظاهر على الشاشة إن وجد",
        "الإجراء المقترح: 🚛 صيانة ميدانية — الأولوية متوسطة",
      ],
    };
  }
  return {
    source: "engine",
    text: `التشخيص المبدئي: ${hit.cause}.`,
    bullets: [
      `🔧 الإصلاح المقترح: ${hit.fix}`,
      `⚙️ القطعة المتوقعة: ${hit.part}`,
      `⏱️ الأولوية: ${hit.urgency}`,
      hit.urgency === "عاجلة" || hit.urgency === "عالية"
        ? "🚛 نوصي بصيانة ميدانية فورية"
        : "🏢 يمكن إصلاحها في ورشة الشركة بجدة",
    ],
  };
}

function engineDescribe(d: Record<string, string | number>): AiResult {
  const name = String(d.nameAr ?? "المعدة");
  const cap = String(d.capacity ?? "");
  const origin = String(d.originAr ?? "");
  const brand = String(d.brand ?? "");
  const cond = d.condition === "used" ? "مستعملة ومجددة بالكامل في ورشنا بجدة" : "جديدة بالكرتون";
  return {
    source: "engine",
    text: `${name} من ${brand} ${origin} الصنع بسعة ${cap}. ${cond}، مثالية للمغاسل التجارية والفنادق، مع ضمان معتمد وتركيب ميداني وتدريب على التشغيل من فريق شركة النجيب المتطورة في جدة.`,
    bullets: [
      "هيكل ستانلس ستيل مقاوم للصدأ",
      "استهلاك منخفض للطاقة والمياه",
      "قطع غيار متوفرة في مستودع جدة",
      "تركيب ميداني وتشغيل تجريبي مجاني",
      "ضمان معتمد وخدمة صيانة سريعة",
    ],
  };
}

function engineRecommend(input: string): AiResult {
  const n = parseInt(input.replace(/[^\d]/g, "") || "0", 10);
  const size = n >= 200 ? "كبيرة" : n >= 60 ? "متوسطة" : "صغيرة";
  const pack =
    size === "كبيرة"
      ? ["غسالة فنادق 50 كجم × 2", "نشافة صناعية 50 كجم × 2", "مكبس بخار 35 بوصة", "غلاية 500 كجم بخار/ساعة"]
      : size === "متوسطة"
        ? ["غسالة كمبيوتر 24 كجم", "نشافة 24 كجم", "مكبس بخار 24 بوصة", "غلاية 240 كجم بخار/ساعة"]
        : ["غسالة كمبيوتر 15 كجم", "نشافة 15 كجم", "مكبس قمصان 15 بوصة", "مولد بخار فوري 100 كجم/ساعة"];
  return {
    source: "engine",
    text: `بناءً على حجم التشغيل المذكور، أنصح بباقة مغسلة ${size}:`,
    bullets: [...pack, "💡 يمكن تخفيض التكلفة باختيار معدات مجددة بضمان"],
  };
}

function engineChat(input: string, section?: string): AiResult {
  const t = input.toLowerCase();

  // section-aware expert answer
  const exp = section ? SECTION_EXPERT[section] : undefined;
  if (exp && (t.includes("نصيح") || t.includes("اختار") || t.includes("أختار") || t.includes("مناسب") || t.length < 12)) {
    return { source: "engine", text: `خبير ${exp.name} في خدمتك — إليك أهم ما يجب معرفته:`, bullets: exp.tips };
  }
  if (t.includes("حجز")) return { source: "engine", text: "يمكنك حجز أي ماكينة مؤقتاً لمدة 24 ساعة مجاناً بعد تسجيل الدخول، ويُقفل الشراء على بقية العملاء خلال المدة." };
  if (t.includes("شحن") || t.includes("توصيل") || t.includes("تركيب"))
    return { source: "engine", text: "نوصّل ونركّب في جميع مدن المملكة. تُحسب الرسوم تلقائياً حسب المسافة بالكيلومتر من مستودعنا في جدة ووزن الماكينة، وتظهر في الفاتورة قبل الدفع." };
  if (t.includes("ضمان")) return { source: "engine", text: "الضمان من 6 أشهر حتى سنتين حسب الماكينة، ويشمل قطع الغيار والعمالة، مع صيانة دورية وقطع غيار متوفرة في جدة." };
  if (t.includes("دفع") || t.includes("سعر") || t.includes("تقسيط"))
    return { source: "engine", text: "الدفع عبر مدى أو Apple Pay أو تحويل بنكي إلى حساب الشركة المعتمد، والمبلغ يشمل الماكينة والشحن والتركيب وضريبة 15%." };
  if (t.includes("صيانة") || t.includes("عطل")) return engineDiagnose(input);
  if (exp) return { source: "engine", text: `خبير ${exp.name}:`, bullets: exp.tips };
  return {
    source: "engine",
    text: "أهلاً بك في منصة شركة النجيب المتطورة لجميع أنواع معدات المغاسل. أستطيع مساعدتك في اختيار المعدات، تشخيص الأعطال، وحساب الشحن والتركيب.",
    bullets: ["اسألني: ما المناسب لمغسلة 100 كجم يومياً؟", "اسألني: غسالتي تعطي كود E23", "اسألني: كم رسوم الشحن إلى الرياض؟"],
  };
}

export async function runAi(task: AiTask, input: string, meta?: Record<string, string | number>): Promise<AiResult> {
  const section = meta?.section ? String(meta.section) : undefined;
  const prompts: Record<AiTask, string> = {
    describe: `اكتب وصفاً تسويقياً احترافياً (3 أسطر) ثم 5 مميزات كنقاط لهذه المعدة: ${JSON.stringify(meta ?? {})}`,
    diagnose: `شخّص هذا العطل في معدة مغسلة واذكر السبب المحتمل والإصلاح والقطعة المطلوبة ودرجة الأولوية ونوع الخدمة (ميدانية/ورشة):\n${input}`,
    recommend: `اقترح باقة معدات مغسلة مناسبة مع السعات، للحالة التالية:\n${input}`,
    chat: section && SECTION_EXPERT[section] ? `سؤال عن قسم ${SECTION_EXPERT[section].name}: ${input}` : input,
    summarize: `لخّص البيانات التالية في نقاط تشغيلية مفيدة لمالك الشركة:\n${input}`,
  };

  const llm = await callLLM(prompts[task]);
  if (llm) {
    const lines = llm.split("\n").map((l) => l.trim()).filter(Boolean);
    const bullets = lines.filter((l) => /^[-•*\d]/.test(l)).map((l) => l.replace(/^[-•*\d.)\s]+/, ""));
    const text = lines.filter((l) => !/^[-•*\d]/.test(l)).join(" ") || llm;
    return { text, bullets: bullets.length ? bullets : undefined, source: "llm" };
  }

  switch (task) {
    case "diagnose": return engineDiagnose(input);
    case "describe": return engineDescribe(meta ?? {});
    case "recommend": return engineRecommend(input);
    case "summarize": return { source: "engine", text: "ملخص سريع: راجع لوحة النظرة العامة للإيرادات ونسب التوصيل والتذاكر المفتوحة." };
    default: return engineChat(input, section);
  }
}

export function aiEnabled() {
  return !!KEY();
}
