/* ------------------------------------------------------------------ *
 *  AI PROJECT ADVISOR
 *  Guides a customer across the full lifecycle of a laundry project:
 *  1) before bidding  → feasibility, capital readiness, honest warnings
 *  2) after winning   → setup, launch, pricing, staffing
 *  3) while operating → sustainability, KPIs, pitfalls to avoid
 * ------------------------------------------------------------------ */

export type Phase = "explore" | "prepare" | "launch" | "operate" | "grow";

export const PHASES: { key: Phase; label: string; icon: string; desc: string }[] = [
  { key: "explore", label: "قبل الدخول للمزاد", icon: "🔍", desc: "دراسة الجدوى وجاهزية رأس المال" },
  { key: "prepare", label: "التجهيز والموقع", icon: "📐", desc: "اختيار المحل والتراخيص والبنية" },
  { key: "launch", label: "التركيب والانطلاق", icon: "🚀", desc: "التشغيل الفعلي وأول 30 يوماً" },
  { key: "operate", label: "التشغيل اليومي", icon: "⚙️", desc: "الإنتاجية والجودة والعمالة" },
  { key: "grow", label: "الاستدامة والنمو", icon: "📈", desc: "الربحية والتوسع وتجنب الانهيار" },
];

export type ProjectSize = "small" | "medium" | "central" | "hotel" | "hospital" | "carpet";

/** Real operating economics per project size (Saudi market, monthly SAR). */
const ECONOMICS: Record<ProjectSize, {
  label: string; capital: [number, number];
  capacityKg: number;      // machine capacity per day
  utilisation: number;     // realistic share of capacity actually sold (year 1)
  pricePerKg: number;      // net price after discounts/free redo
  rent: number; staff: number; salary: number; utilities: number; consumables: number;
  otherFixed: number;      // licences, insurance, marketing, maintenance reserve
}> = {
  small:    { label: "مغسلة حي صغيرة", capital: [35000, 80000],   capacityKg: 120, utilisation: 0.45, pricePerKg: 8,  rent: 2800, staff: 2, salary: 2400, utilities: 2200, consumables: 1400, otherFixed: 1200 },
  medium:   { label: "مغسلة متوسطة",   capital: [80000, 180000],  capacityKg: 320, utilisation: 0.50, pricePerKg: 7,  rent: 5500, staff: 4, salary: 2500, utilities: 4800, consumables: 3200, otherFixed: 2200 },
  central:  { label: "مغسلة مركزية",   capital: [180000, 600000], capacityKg: 950, utilisation: 0.55, pricePerKg: 5.5, rent: 13000, staff: 9, salary: 2600, utilities: 12500, consumables: 8500, otherFixed: 5000 },
  hotel:    { label: "مغسلة فندق",     capital: [120000, 350000], capacityKg: 520, utilisation: 0.60, pricePerKg: 6,  rent: 7500, staff: 6, salary: 2600, utilities: 7200, consumables: 4800, otherFixed: 3000 },
  hospital: { label: "مغسلة مستشفى",   capital: [150000, 400000], capacityKg: 470, utilisation: 0.58, pricePerKg: 8,  rent: 8500, staff: 6, salary: 2800, utilities: 7800, consumables: 6000, otherFixed: 3800 },
  carpet:   { label: "مغسلة سجاد",     capital: [90000, 250000],  capacityKg: 220, utilisation: 0.40, pricePerKg: 12, rent: 6500, staff: 3, salary: 2500, utilities: 3800, consumables: 2400, otherFixed: 2000 },
};

export type Feasibility = {
  size: ProjectSize; label: string;
  capitalRange: [number, number];
  equipmentBudget: number; setupCost: number; workingCapital: number; totalNeeded: number;
  monthlyRevenue: number; monthlyCost: number; monthlyProfit: number; marginPct: number;
  paybackMonths: number; breakEvenKgPerDay: number; dailyKg: number;
  readiness: "ready" | "tight" | "insufficient";
  verdict: string;
  breakdown: { label: string; value: number }[];
};

/** Honest feasibility study — no inflated promises. */
export function studyFeasibility(size: ProjectSize, availableCapital: number): Feasibility {
  const e = ECONOMICS[size];

  // capital split: equipment is only part of what a real project needs
  const equipmentBudget = Math.round(availableCapital * 0.62);
  const setupCost = Math.round(availableCapital * 0.2);   // fit-out, plumbing, electricity, licences
  const workingCapital = Math.round(availableCapital * 0.18); // 3 months of running costs

  // realistic year-1 volume = capacity × utilisation, 26 working days
  const dailyKg = Math.round(e.capacityKg * e.utilisation);
  const monthlyRevenue = Math.round(dailyKg * e.pricePerKg * 26);
  const staffCost = e.staff * e.salary;
  const monthlyCost = e.rent + staffCost + e.utilities + e.consumables + e.otherFixed;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const marginPct = monthlyRevenue ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;
  const totalNeeded = e.capital[0];
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(Math.max(availableCapital, e.capital[0]) / monthlyProfit) : 0;
  const breakEvenKgPerDay = Math.ceil(monthlyCost / (e.pricePerKg * 26));
  void 0;

  // capital alone isn't enough — the plan must also be profitable
  const capitalOk = availableCapital >= e.capital[0] * 1.15;
  const capitalTight = availableCapital >= e.capital[0];
  const readiness: Feasibility["readiness"] =
    monthlyProfit <= 0 ? "insufficient"
    : monthlyProfit < monthlyCost * 0.1 ? "tight"
    : capitalOk ? "ready"
    : capitalTight ? "tight"
    : "insufficient";

  const verdict =
    readiness === "ready"
      ? `رأس مالك مناسب لمشروع ${e.label}. تقدير متحفظ للسنة الأولى: ${dailyKg} كجم يومياً (${Math.round(e.utilisation * 100)}% من طاقة المعدات)، بربح شهري ${monthlyProfit.toLocaleString("en-US")} ر.س واسترداد خلال ${paybackMonths} شهراً. الأرقام تقديرية وتعتمد على الموقع وجهدك التسويقي.`
      : readiness === "tight"
        ? `رأس مالك يكفي بالحد الأدنى لمشروع ${e.label}، لكن دون احتياطي. ننصح بتأمين ${Math.round(e.capital[0] * 0.2).toLocaleString("en-US")} ر.س إضافية كرأس مال تشغيلي قبل البدء.`
        : monthlyProfit <= 0
          ? `تحذير مهم: بالحجم الافتراضي لمشروع ${e.label} (${dailyKg} كجم يومياً) لن يحقق ربحاً — التكاليف الثابتة ${monthlyCost.toLocaleString("en-US")} ر.س تتجاوز الإيراد. يجب أن تتجاوز ${breakEvenKgPerDay} كجم يومياً لتغطية التكاليف. الحلول: عقود ثابتة مع فنادق وشقق، أو موقع بكثافة سكانية أعلى، أو خفض الإيجار والعمالة.`
          : `رأس مالك أقل من الحد الآمن لمشروع ${e.label} (${e.capital[0].toLocaleString("en-US")} ر.س). الخيار الأفضل: ابدأ بحجم أصغر أو بمعدات مستخدمة مجددة بضمان.`;

  return {
    size, label: e.label, capitalRange: e.capital,
    equipmentBudget, setupCost, workingCapital, totalNeeded,
    monthlyRevenue, monthlyCost, monthlyProfit, marginPct,
    paybackMonths, breakEvenKgPerDay, readiness, verdict,
    dailyKg,
    breakdown: [
      { label: "المعدات", value: equipmentBudget },
      { label: "تجهيز المحل والتراخيص", value: setupCost },
      { label: "رأس مال تشغيلي (3 أشهر)", value: workingCapital },
      { label: "الإيجار الشهري", value: e.rent },
      { label: `رواتب ${e.staff} عمال`, value: staffCost },
      { label: "كهرباء ومياه وغاز", value: e.utilities },
      { label: "مواد ومستهلكات", value: e.consumables },
      { label: "رخص وتأمين وتسويق واحتياطي صيانة", value: e.otherFixed },
    ],
  };
}

/** Actionable guidance for each lifecycle phase. */
export const PHASE_GUIDE: Record<Phase, { title: string; steps: string[]; warnings: string[] }> = {
  explore: {
    title: "قبل أن تدخل المزاد — تأكد من هذه النقاط",
    steps: [
      "احسب رأس مالك الكامل: المعدات ليست سوى 60% — تحتاج تجهيز المحل ورأس مال تشغيلي 3 أشهر",
      "ادرس الحي: عدد السكان، الشقق المفروشة، المطاعم والفنادق القريبة",
      "أحصِ المغاسل المنافسة في دائرة 1 كم واعرف أسعارها",
      "تأكد من توفر كهرباء 3 فاز وصرف صحي مناسب في المحل قبل التعاقد",
      "استشر فريقنا مجاناً قبل تقديم عرضك — الاستشارة جزء من الخدمة",
    ],
    warnings: [
      "لا تستثمر كل مدخراتك — اترك 20% احتياطاً للطوارئ",
      "لا تستأجر محلاً قبل التأكد من الكهرباء ثلاثية الأطوار والصرف",
      "تجنب المواقع بلا مواقف سيارات — تفقد 40% من العملاء",
    ],
  },
  prepare: {
    title: "التجهيز والموقع — أساس نجاح المشروع",
    steps: [
      "استخرج السجل التجاري ورخصة البلدية ورخصة الدفاع المدني قبل التركيب",
      "المساحة المثالية: 60–80 م² لمغسلة صغيرة، 150+ م² للمتوسطة",
      "خصص مسار عمل متسلسل: استلام ← فرز ← غسيل ← تجفيف ← كي ← تغليف ← تسليم",
      "ركّب خزان مياه احتياطي ومعالج عسر المياه — يطيل عمر المعدات سنوات",
      "جهّز التهوية والشفط جيداً، فالحرارة العالية تقتل المعدات والعمالة",
    ],
    warnings: [
      "لا تهمل معالجة المياه — الترسبات الجيرية أكبر قاتل للغلايات والسخانات",
      "لا تضع النشافة بجوار الغسالة مباشرة دون تهوية — تنخفض كفاءتها 25%",
      "التمديدات الكهربائية غير المطابقة تبطل الضمان وتسبب حرائق",
    ],
  },
  launch: {
    title: "التركيب والانطلاق — أول 30 يوماً",
    steps: [
      "فريقنا يركّب ويشغّل ويجرّب المعدات مجاناً ويدرّب عمالتك",
      "شغّل دورات تجريبية أسبوعاً كاملاً قبل استقبال العملاء",
      "ابدأ بأسعار السوق ثم ميّز نفسك بالجودة والسرعة لا بالسعر الأقل",
      "افتتاح ترويجي: خصم 20% لأول 100 عميل مقابل تسجيل أرقامهم",
      "صوّر كل قطعة عند الاستلام — يحميك من نزاعات التلف",
    ],
    warnings: [
      "لا تقبل كميات أكبر من طاقتك في الأسبوع الأول — التأخير يدمّر السمعة",
      "لا تبدأ بعمالة غير مدربة — الخطأ الواحد قد يتلف قطعة عميل باهظة",
      "تجنب حرب الأسعار من اليوم الأول، فهي تستنزفك ولا تبني ولاءً",
    ],
  },
  operate: {
    title: "التشغيل اليومي — إدارة تحفظ الربح",
    steps: [
      "راقب 3 أرقام يومياً: الكيلوجرامات المنجزة · تكلفة الكهرباء · عدد الشكاوى",
      "شغّل الغسالة بحمولة كاملة دائماً — نصف حمولة يعني ضعف التكلفة لكل كيلو",
      "نظّف فلاتر الوبر يومياً — يرفع كفاءة التجفيف 20% ويمنع الحرائق",
      "اعتمد نظام أكياس مرقّمة وإيصالات لكل عميل لمنع الضياع",
      "فعّل عقد الصيانة الدورية معنا بأجور رمزية تغطي عمل اليد والتنقل",
    ],
    warnings: [
      "تأجيل الصيانة الدورية يحوّل عطلاً بـ300 ريال إلى عطل بـ5000 ريال",
      "الإفراط في المنظفات يتلف الأقمشة ويرفع التكلفة دون فائدة",
      "عدم تسجيل الإيرادات يومياً يجعلك تكتشف الخسارة بعد فوات الأوان",
    ],
  },
  grow: {
    title: "الاستدامة والنمو — كيف يستمر المشروع سنوات",
    steps: [
      "وقّع عقوداً شهرية مع الفنادق والشقق المفروشة والمطاعم — دخل ثابت مضمون",
      "أضف خدمة التوصيل: ترفع الإيراد 30% بتكلفة سائق واحد",
      "خصص 5% من الأرباح شهرياً لصندوق تجديد المعدات",
      "وسّع أفقياً بخدمات جديدة (سجاد، ستائر، جلد) قبل فتح فرع ثانٍ",
      "استبدل المعدات عند بلوغها 70% من عمرها الافتراضي — لدينا برنامج استبدال",
    ],
    warnings: [
      "لا تفتح فرعاً ثانياً قبل أن يعمل الأول بربح ثابت 6 أشهر متتالية",
      "سحب كل الأرباح شهرياً دون احتياطي يوقف المشروع عند أول عطل كبير",
      "الاعتماد على عميل واحد كبير خطر — إذا رحل انهار دخلك",
    ],
  },
};

/** Post-installation follow-up checkpoints. */
export const FOLLOWUP_PLAN = [
  { day: 3, title: "متابعة التشغيل الأولي", detail: "التأكد من ضبط البرامج ودرجات الحرارة وعدم وجود تسريبات" },
  { day: 14, title: "مراجعة الأداء والعمالة", detail: "قياس الإنتاجية الفعلية وتصحيح أخطاء التشغيل المتكررة" },
  { day: 30, title: "تقرير الشهر الأول", detail: "مقارنة الإيراد الفعلي بالمتوقع وضبط التسعير والطاقة" },
  { day: 90, title: "الصيانة الوقائية الأولى", detail: "فحص شامل ومعايرة بأجور رمزية تغطي عمل اليد والتنقل" },
  { day: 180, title: "مراجعة الربحية النصف سنوية", detail: "تحليل التكاليف واقتراح فرص التوسع أو خفض المصاريف" },
];

/** Diagnose an operating project and return prioritised advice. */
export function diagnoseOperation(input: {
  monthlyRevenue?: number; monthlyCost?: number; dailyKg?: number;
  capacityKg?: number; complaints?: number; staff?: number;
}) {
  const advice: { level: "critical" | "warn" | "good"; title: string; detail: string }[] = [];
  const rev = input.monthlyRevenue ?? 0;
  const cost = input.monthlyCost ?? 0;
  const profit = rev - cost;

  if (rev && cost) {
    const margin = Math.round((profit / rev) * 100);
    if (profit <= 0) {
      advice.push({ level: "critical", title: "المشروع يعمل بخسارة", detail: `الخسارة ${Math.abs(profit).toLocaleString("en-US")} ر.س شهرياً. راجع التسعير فوراً وقلّل الهدر في الكهرباء والمنظفات، وابحث عن عقود شهرية ثابتة.` });
    } else if (margin < 15) {
      advice.push({ level: "warn", title: `هامش الربح منخفض (${margin}%)`, detail: "الهامش الصحي للمغاسل 25–40%. ارفع الأسعار تدريجياً 10% أو قلّل التكاليف الثابتة." });
    } else {
      advice.push({ level: "good", title: `هامش ربح صحي (${margin}%)`, detail: "حافظ عليه وخصص 5% من الأرباح لصندوق تجديد المعدات." });
    }
  }

  if (input.dailyKg && input.capacityKg) {
    const util = Math.round((input.dailyKg / input.capacityKg) * 100);
    if (util < 45) {
      advice.push({ level: "warn", title: `استغلال الطاقة ضعيف (${util}%)`, detail: "معداتك أكبر من الطلب الحالي. ركّز على التسويق المحلي وعقود الفنادق بدل شراء معدات إضافية." });
    } else if (util > 90) {
      advice.push({ level: "warn", title: `المعدات على وشك الاختناق (${util}%)`, detail: "التشغيل فوق 90% يسرّع الأعطال. أضف وحدة إضافية أو وردية ثانية قبل أن تتعطل." });
    } else {
      advice.push({ level: "good", title: `استغلال مثالي للطاقة (${util}%)`, detail: "هذا النطاق يوازن بين الربحية وعمر المعدات." });
    }
  }

  if (input.complaints !== undefined) {
    if (input.complaints > 10) advice.push({ level: "critical", title: "معدل شكاوى مرتفع", detail: "الشكاوى تقتل السمعة أسرع من أي منافس. درّب العمالة على الفرز ودرجات الحرارة، واعتمد إيصالات مرقّمة." });
    else if (input.complaints > 3) advice.push({ level: "warn", title: "شكاوى تحتاج معالجة", detail: "راجع أكثر شكوى تتكرر وعالج سببها الجذري هذا الأسبوع." });
    else advice.push({ level: "good", title: "جودة الخدمة ممتازة", detail: "استثمر ذلك في طلب تقييمات من العملاء لجذب عملاء جدد." });
  }

  if (advice.length === 0) {
    advice.push({ level: "good", title: "أدخل أرقام تشغيلك", detail: "أدخل الإيراد والتكاليف والكميات لأعطيك تحليلاً دقيقاً لمشروعك." });
  }
  return { profit, advice };
}
