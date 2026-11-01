"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-gold rounded-xl px-4 py-2 text-sm">
      ⬇️ تحميل الفاتورة PDF
    </button>
  );
}
