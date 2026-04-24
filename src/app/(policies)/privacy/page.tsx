'use client';

import { useState } from 'react';

const EFFECTIVE_DATE_EN = 'April 17, 2026';
const EFFECTIVE_DATE_HE = '17 באפריל 2026';
const SUPPORT_EMAIL = 'Support@lessons-scheduler.com';

function Email() {
  return <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a>;
}

function LangToggle({ lang, onToggle }: { lang: 'en' | 'he'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="text-sm text-blue-600 hover:underline border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50 transition-colors"
    >
      {lang === 'en' ? 'עברית' : 'English'}
    </button>
  );
}

function EnglishContent() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>Effective Date:</strong> {EFFECTIVE_DATE_EN}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {EFFECTIVE_DATE_EN}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        This Privacy Policy describes how Ronen Wolfsberger ("we," "us," or "our") collects, uses, and shares
        information when you use the Lessons Scheduler application and related services (collectively, the "Service").
      </p>
      <p className="text-gray-700 leading-relaxed mb-3">
        By using the Service, you agree to this Privacy Policy. If you do not agree, do not use the Service.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Information We Collect</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.1 Information You Provide</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Account information:</strong> name, email address, phone number (optional).</li>
        <li><strong>Scheduling data:</strong> lessons, students/teachers, dates, times, notes, and related entries you create.</li>
        <li><strong>Payment information:</strong> payment is processed by Google Play Billing or Stripe. We do not store your full card number.</li>
        <li><strong>Communications:</strong> messages you send to us through support channels.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.2 Information Collected Automatically</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Device and usage data:</strong> device model, operating system, app version, language, crash logs, IP address, and in-app actions.</li>
        <li><strong>Identifiers:</strong> an app-generated user ID and, where permitted, device identifiers.</li>
        <li><strong>Cookies and similar technologies:</strong> used for authentication and preferences.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.3 Information from Third Parties</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Sign-in providers:</strong> if you sign in with Google or via magic link, we receive your name, email, and profile image.</li>
        <li><strong>Calendar integrations:</strong> if you connect Google Calendar, we access event data you explicitly share.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. How We Use Information</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Provide, maintain, and improve the Service.</li>
        <li>Process subscriptions, renewals, refunds, and related billing.</li>
        <li>Send service-related notifications (lesson reminders, billing receipts, policy updates).</li>
        <li>Respond to support requests.</li>
        <li>Detect, prevent, and address fraud, abuse, and security issues.</li>
        <li>Analyze usage to improve performance and features.</li>
        <li>Comply with legal obligations.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        We do <strong>not</strong> sell your personal information. We do <strong>not</strong> use your scheduling data or lesson content for advertising.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Legal Bases (GDPR)</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Contract:</strong> to provide the Service you signed up for.</li>
        <li><strong>Legitimate interests:</strong> to secure, improve, and analyze the Service.</li>
        <li><strong>Consent:</strong> for optional features.</li>
        <li><strong>Legal obligation:</strong> tax, accounting, and regulatory compliance.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. How We Share Information</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Service providers:</strong> cloud hosting (Supabase/Firebase), email delivery (Resend), payment processing (Google Play, Stripe).</li>
        <li><strong>Legal and safety:</strong> when required by law or to protect rights and safety.</li>
        <li><strong>Business transfers:</strong> if we are acquired or merged, information may transfer to the new entity.</li>
        <li><strong>With your consent:</strong> for any other sharing you explicitly approve.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. International Data Transfers</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        Information may be processed in countries other than your own, including the United States and the EU. Where required, we use appropriate safeguards (e.g., Standard Contractual Clauses).
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. Data Retention</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Account and scheduling data are deleted within 30 days of account deletion.</li>
        <li>Backups are purged within 90 days.</li>
        <li>Billing records may be retained longer where required by law.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Your Rights</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Access, correct, or delete your personal data.</li>
        <li>Export your data in a portable format.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent at any time.</li>
        <li>Lodge a complaint with a data protection authority.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        <strong>California residents (CCPA/CPRA):</strong> you have the right to know, delete, correct, and opt out of "sales" of personal information. We do not sell your personal information.
      </p>
      <p className="text-gray-700 leading-relaxed mb-3">To exercise your rights, contact us at <Email />.</p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Account Deletion</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>In-app:</strong> Settings → Account → Delete Account.</li>
        <li><strong>On the web:</strong> lessons-scheduler.com/delete-account</li>
        <li><strong>By email:</strong> <Email /></li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. Children&apos;s Privacy</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        The Service is not directed to children under 13. We do not knowingly collect personal information from children. If the Service is used for a minor, the minor&apos;s parent or legal guardian must hold the account.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. Security</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        We use reasonable technical and organizational measures to protect information, including TLS encryption in transit, encryption at rest, and access controls. No method is 100% secure.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. Third-Party Services</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        The Service may integrate with third-party services. Their privacy practices are governed by their own policies.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. Changes to This Policy</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        We may update this Privacy Policy. If changes are material, we will notify you in-app or by email before they take effect.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. Contact Us</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>Email: <Email /></p>
        <p><a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">lessons-scheduler.com</a></p>
      </address>
    </article>
  );
}

function HebrewContent() {
  return (
    <article dir="rtl" lang="he">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">מדיניות פרטיות</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>תאריך תחילת תוקף:</strong> {EFFECTIVE_DATE_HE}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>עדכון אחרון:</strong> {EFFECTIVE_DATE_HE}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        מדיניות פרטיות זו מתארת כיצד רונן וולפסברגר ("אנחנו" או "שלנו") אוסף, משתמש ומשתף מידע כאשר אתה משתמש ביישום Lessons Scheduler ובשירותים הקשורים אליו (להלן: "השירות").
      </p>
      <p className="text-gray-700 leading-relaxed mb-3">
        שימושך בשירות מהווה הסכמה למדיניות פרטיות זו. אם אינך מסכים, אנא הימנע משימוש בשירות.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. מידע שאנו אוספים</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.1 מידע שאתה מספק</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>פרטי חשבון:</strong> שם, כתובת דואר אלקטרוני, מספר טלפון (אופציונלי).</li>
        <li><strong>נתוני לוח זמנים:</strong> שיעורים, תלמידים/מורים, תאריכים, שעות, הערות ורשומות נוספות שאתה יוצר.</li>
        <li><strong>פרטי תשלום:</strong> התשלומים מעובדים דרך Google Play Billing או Stripe. איננו שומרים את מספר כרטיס האשראי המלא שלך.</li>
        <li><strong>תקשורת:</strong> הודעות שאתה שולח אלינו דרך ערוצי התמיכה.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.2 מידע הנאסף אוטומטית</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>נתוני מכשיר ושימוש:</strong> דגם מכשיר, מערכת הפעלה, גרסת אפליקציה, שפה, יומני קריסה, כתובת IP ופעולות באפליקציה.</li>
        <li><strong>מזהים:</strong> מזהה משתמש שנוצר באפליקציה ומזהי מכשיר, בהתאם להרשאות.</li>
        <li><strong>עוגיות וטכנולוגיות דומות:</strong> לצורך אימות והגדרות אישיות.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">1.3 מידע מצדדים שלישיים</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>ספקי כניסה:</strong> אם אתה נכנס באמצעות Google או קישור קסם, אנו מקבלים את שמך, דואר אלקטרוני ותמונת פרופיל.</li>
        <li><strong>שילוב יומן:</strong> אם אתה מחבר את Google Calendar, אנו ניגשים לנתוני אירועים שאתה משתף במפורש.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. כיצד אנו משתמשים במידע</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>מתן, תחזוקה ושיפור השירות.</li>
        <li>עיבוד מנויים, חידושים, החזרים וחיוב.</li>
        <li>שליחת התראות הקשורות לשירות (תזכורות שיעורים, קבלות חיוב, עדכוני מדיניות).</li>
        <li>מענה לפניות תמיכה.</li>
        <li>זיהוי, מניעה וטיפול בהונאה, שימוש לרעה ובעיות אבטחה.</li>
        <li>ניתוח שימוש לשיפור הביצועים והתכונות.</li>
        <li>עמידה בחובות חוקיות.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנחנו <strong>לא</strong> מוכרים את המידע האישי שלך. אנחנו <strong>לא</strong> משתמשים בנתוני לוח הזמנים שלך לצורכי פרסום.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. בסיסים משפטיים (GDPR)</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>חוזה:</strong> לצורך מתן השירות שנרשמת אליו.</li>
        <li><strong>אינטרסים לגיטימיים:</strong> לצורך אבטחה, שיפור וניתוח השירות.</li>
        <li><strong>הסכמה:</strong> לתכונות אופציונליות.</li>
        <li><strong>חובה חוקית:</strong> עמידה בדרישות מס, ראיית חשבון ורגולציה.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. כיצד אנו משתפים מידע</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>ספקי שירות:</strong> אירוח בענן (Supabase/Firebase), משלוח דואר אלקטרוני (Resend), עיבוד תשלומים (Google Play, Stripe).</li>
        <li><strong>חוק ובטיחות:</strong> כאשר נדרש על פי חוק או לצורך הגנה על זכויות ובטיחות.</li>
        <li><strong>העברות עסקיות:</strong> אם נירכש או נתמזג, המידע עשוי לעבור לגוף החדש.</li>
        <li><strong>בהסכמתך:</strong> לכל שיתוף אחר שאתה מאשר במפורש.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. העברת מידע בינלאומית</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        המידע עשוי להיות מעובד במדינות שונות, כולל ארצות הברית והאיחוד האירופי. כאשר נדרש, אנו משתמשים באמצעי הגנה מתאימים (כגון סעיפים חוזיים סטנדרטיים).
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. שמירת מידע</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>נתוני חשבון ולוח זמנים נמחקים תוך 30 יום ממחיקת החשבון.</li>
        <li>גיבויים נמחקים תוך 90 יום.</li>
        <li>רשומות חיוב עשויות להישמר לתקופה ארוכה יותר בהתאם לדרישות חוקיות.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. הזכויות שלך</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>גישה, תיקון או מחיקה של הנתונים האישיים שלך.</li>
        <li>ייצוא הנתונים שלך בפורמט ניתן להעברה.</li>
        <li>התנגדות או הגבלת עיבוד מסוים.</li>
        <li>שלילת הסכמה בכל עת.</li>
        <li>הגשת תלונה לרשות להגנת מידע.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        למימוש זכויותיך, פנה אלינו בכתובת: <Email />
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. מחיקת חשבון</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>באפליקציה:</strong> הגדרות ← חשבון ← מחק חשבון.</li>
        <li><strong>באתר:</strong> lessons-scheduler.com/delete-account</li>
        <li><strong>בדואר אלקטרוני:</strong> <Email /></li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. פרטיות ילדים</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        השירות אינו מיועד לילדים מתחת לגיל 13. אם השירות משמש לקביעת שיעורים לקטין, ההורה או האפוטרופוס החוקי חייב להחזיק בחשבון.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. אבטחה</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו משתמשים באמצעים טכניים וארגוניים סבירים להגנה על המידע, כולל הצפנת TLS בזמן העברה, הצפנה במנוחה ובקרות גישה. שום שיטה אינה מאובטחת לחלוטין.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. שירותי צד שלישי</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        השירות עשוי להשתלב עם שירותי צד שלישי. מדיניות הפרטיות שלהם חלה על השימוש בהם.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. שינויים במדיניות</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. אם השינויים מהותיים, נודיע לך באפליקציה או בדואר אלקטרוני לפני שייכנסו לתוקף.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. צור קשר</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>רונן וולפסברגר</strong></p>
        <p>רחוב הצבר 20, קדימה, ישראל</p>
        <p>דואר אלקטרוני: <Email /></p>
        <p><a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">lessons-scheduler.com</a></p>
      </address>
    </article>
  );
}

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<'en' | 'he'>('en');
  return (
    <div>
      <div className="flex justify-end mb-6">
        <LangToggle lang={lang} onToggle={() => setLang(l => l === 'en' ? 'he' : 'en')} />
      </div>
      {lang === 'en' ? <EnglishContent /> : <HebrewContent />}
    </div>
  );
}
