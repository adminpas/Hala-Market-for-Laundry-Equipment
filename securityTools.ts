import { scanPayload, checkLink, isTrustedLink, fraudScore, detectBot, securityReport } from "./security";

export { checkLink, isTrustedLink, securityReport };

/** Live self-test proving each defence layer actually works. */
export async function runSelfTest() {
  const tests: { name: string; pass: boolean; detail: string }[] = [];

  const sqli = scanPayload({ q: "1' OR 1=1 --" }, "/selftest");
  tests.push({ name: "حقن SQL", pass: !!sqli, detail: sqli ? "تم الكشف والحجب" : "لم يُكتشف" });

  const xss = scanPayload({ note: "<script>document.cookie</script>" }, "/selftest");
  tests.push({ name: "XSS", pass: !!xss, detail: xss ? "تم الكشف والحجب" : "لم يُكتشف" });

  const trav = scanPayload({ file: "../../etc/passwd" }, "/selftest");
  tests.push({ name: "اختراق المسارات", pass: !!trav, detail: trav ? "تم الكشف والحجب" : "لم يُكتشف" });

  const phish = checkLink("http://bit.ly/free-money");
  tests.push({ name: "روابط وهمية", pass: !!phish, detail: phish ? phish.detail : "لم يُكتشف" });

  const js = checkLink("javascript:alert(1)");
  tests.push({ name: "روابط تنفيذ نصوص", pass: !!js, detail: js ? "تم الحجب" : "لم يُكتشف" });

  const bot = detectBot("sqlmap/1.5");
  tests.push({ name: "أدوات الاختراق", pass: !!bot, detail: bot ? "تم الحظر" : "لم يُكتشف" });

  const fr = fraudScore({ amount: 900000, distanceKm: 1500, accountAgeMin: 1, ordersLastHour: 6, phone: "0555555555", sameIpAccounts: 4 });
  tests.push({ name: "كشف الاحتيال", pass: fr.action === "block", detail: `درجة الخطورة ${fr.score}% — ${fr.action}` });

  const clean = scanPayload({ name: "غسالة كمبيوتر 24 كجم" }, "/selftest");
  tests.push({ name: "عدم حجب المدخلات السليمة", pass: !clean, detail: clean ? "إنذار كاذب!" : "سليم" });

  const passed = tests.filter((t) => t.pass).length;
  return { tests, passed, total: tests.length, score: Math.round((passed / tests.length) * 100) };
}
