# ملف قاعدة البيانات

## المحرك
PostgreSQL عبر Drizzle ORM.

## مجموعات الجداول
- الكتالوج: products, categories, services, bundles.
- العملاء: customers, cart_items.
- التجارة: bookings, orders, payment_transactions, payment_settings.
- العمليات: maintenance_requests, technicians, special_requests.
- التسويق: ads, news_items, auctions, auction_bids, clearance_deals.
- الثقة: equipment_passport, passport_events.
- الأمن: audit_logs, security_events, blocklist.
- الوسائط والإعدادات: media_assets, site_settings.

## التكامل
العلاقات تستخدم Foreign Keys وحذفاً متدرجاً أو Set Null حسب طبيعة السجل. الأسعار والمبالغ أعداد صحيحة بالريال لتجنب أخطاء الكسور.

## قبل الإنتاج
- نسخ احتياطي يومي + Point-in-Time Recovery.
- فهرسة الحقول عالية الاستخدام (phone, status, category, reserved_until, created_at).
- سياسة احتفاظ وحذف متوافقة مع PDPL.
- بيئة Staging منفصلة عن Production.
- منع seed التوضيحي في قاعدة الإنتاج.
