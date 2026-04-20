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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund and Cancellation Policy</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>Effective Date:</strong> {EFFECTIVE_DATE_EN}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {EFFECTIVE_DATE_EN}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        This Refund and Cancellation Policy explains how cancellations and refunds work for Lessons Scheduler subscriptions offered by Ronen Wolfsberger.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Cancelling Your Subscription</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You can cancel at any time. Cancellation stops future renewals; you retain access through the end of your current billing period.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Google Play subscriptions</h3>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>Open the <strong>Google Play Store</strong> app.</li>
        <li>Tap your profile icon → <strong>Payments &amp; subscriptions</strong> → <strong>Subscriptions</strong>.</li>
        <li>Select <strong>Lessons Scheduler</strong> → <strong>Cancel subscription</strong>.</li>
      </ol>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Stripe subscriptions</h3>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>Open <strong>Lessons Scheduler</strong> → <strong>Settings</strong> → <strong>Subscription</strong>.</li>
        <li>Tap <strong>Cancel subscription</strong>, or email <Email />.</li>
      </ol>

      <p className="text-gray-700 leading-relaxed mb-3">
        To avoid being charged for the next period, cancel at least <strong>24 hours before</strong> your current period ends.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. Refunds for Google Play Subscriptions</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        Subscriptions purchased through Google Play are subject to Google&apos;s refund policy. To request a refund:
      </p>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>Visit <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">play.google.com/store/account/subscriptions</a>.</li>
        <li>Find your Lessons Scheduler subscription.</li>
        <li>Tap <strong>Report a problem</strong> and follow the prompts.</li>
      </ol>
      <p className="text-gray-700 leading-relaxed mb-3">
        You can also request a refund directly from us at <Email />.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. Refunds for Direct Purchases (Stripe)</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Eligible scenarios</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Accidental or duplicate charge.</strong></li>
        <li><strong>Technical issue</strong> that prevented you from using the Service and was not resolved in a reasonable time.</li>
        <li><strong>Failed cancellation</strong> that was clearly attempted before renewal.</li>
        <li><strong>Local law requirements</strong> (e.g., statutory withdrawal rights).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">Not typically eligible</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Change of mind after the subscription period has begun and the Service has been used.</li>
        <li>Forgetting to cancel before renewal, except as required by law.</li>
        <li>Dissatisfaction with features that were accurately described before purchase.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">How to request</h3>
      <p className="text-gray-700 leading-relaxed mb-3">Email <Email /> with:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>The email address on your account.</li>
        <li>The date of the charge.</li>
        <li>A brief explanation of the reason.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        We aim to respond within <strong>5 business days</strong> and process approved refunds within <strong>10 business days</strong>.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Statutory Withdrawal Rights (EU/UK)</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        If you are a consumer in the EU or UK, you generally have a <strong>14-day right of withdrawal</strong> from the date of purchase. By starting to use the Service during the withdrawal period, you expressly request immediate performance and may lose your right of withdrawal. Where the right still applies, contact <Email />.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. Free Trials</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        If a free trial is offered, you will not be charged during the trial. Cancel before the trial expires to avoid being charged. Charges after trial conversion are not automatically refundable.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. Chargebacks</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        Before initiating a chargeback, contact <Email /> so we can attempt to resolve the issue directly. Unresolved chargebacks may result in account suspension.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Changes to This Policy</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        We may update this policy from time to time. Material changes will be notified in-app or by email.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Contact</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>Support: <Email /></p>
        <p><a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">lessons-scheduler.com</a></p>
      </address>
    </article>
  );
}

function HebrewContent() {
  return (
    <article dir="rtl" lang="he">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">מדיניות ביטול והחזרים</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>תאריך תחילת תוקף:</strong> {EFFECTIVE_DATE_HE}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>עדכון אחרון:</strong> {EFFECTIVE_DATE_HE}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        מדיניות זו מסבירה כיצד פועלים ביטולים והחזרים עבור מנויים ל-Lessons Scheduler המוצעים על ידי רונן וולפסברגר.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. ביטול מנוי</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        תוכל לבטל את מנויך בכל עת. הביטול מפסיק חידושים עתידיים; הגישה לשירות נשמרת עד סוף תקופת החיוב הנוכחית.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">מנויי Google Play</h3>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>פתח את אפליקציית <strong>Google Play Store</strong>.</li>
        <li>הקש על אייקון הפרופיל ← <strong>תשלומים ומנויים</strong> ← <strong>מנויים</strong>.</li>
        <li>בחר <strong>Lessons Scheduler</strong> ← <strong>בטל מנוי</strong>.</li>
      </ol>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">מנויי Stripe</h3>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>פתח <strong>Lessons Scheduler</strong> ← <strong>הגדרות</strong> ← <strong>מנוי</strong>.</li>
        <li>הקש <strong>בטל מנוי</strong>, או שלח דואר אלקטרוני לכתובת <Email />.</li>
      </ol>

      <p className="text-gray-700 leading-relaxed mb-3">
        כדי למנוע חיוב עבור התקופה הבאה, בטל את המנוי לפחות <strong>24 שעות לפני</strong> סיום התקופה הנוכחית.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. החזרים עבור מנויי Google Play</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        מנויים שנרכשו דרך Google Play כפופים למדיניות ההחזרים של Google. לבקשת החזר:
      </p>
      <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
        <li>בקר בכתובת <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">play.google.com/store/account/subscriptions</a>.</li>
        <li>אתר את מנוי Lessons Scheduler שלך.</li>
        <li>הקש <strong>דווח על בעיה</strong> ועקוב אחר ההוראות.</li>
      </ol>
      <p className="text-gray-700 leading-relaxed mb-3">
        תוכל גם לפנות אלינו ישירות בכתובת <Email /> לבקשת החזר.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. החזרים עבור רכישות ישירות (Stripe)</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">מקרים זכאים</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>חיוב בשגגה או חיוב כפול.</strong></li>
        <li><strong>תקלה טכנית</strong> שמנעה ממך להשתמש בשירות ולא נפתרה בזמן סביר.</li>
        <li><strong>ביטול שנכשל</strong> שנעשה בבירור לפני החידוש.</li>
        <li><strong>דרישות חוק מקומיות</strong> (כגון זכות חזרה סטטוטורית).</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">מקרים שבדרך כלל אינם זכאים</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>חזרה בדעה לאחר שתקופת המנוי החלה והשירות שימש.</li>
        <li>שכחת לבטל לפני החידוש, אלא כנדרש בחוק.</li>
        <li>חוסר שביעות רצון מתכונות שתוארו בדיוק לפני הרכישה.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">כיצד לבקש החזר</h3>
      <p className="text-gray-700 leading-relaxed mb-3">שלח דואר אלקטרוני לכתובת <Email /> עם:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>כתובת הדואר האלקטרוני של חשבונך.</li>
        <li>תאריך החיוב.</li>
        <li>הסבר קצר לסיבה.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו שואפים להגיב תוך <strong>5 ימי עסקים</strong> ולעבד החזרים מאושרים תוך <strong>10 ימי עסקים</strong>.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. זכות חזרה סטטוטורית (האיחוד האירופי / בריטניה)</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אם אתה צרכן באיחוד האירופי או בבריטניה, יש לך בדרך כלל <strong>זכות חזרה בת 14 יום</strong> מיום הרכישה. בהתחלת שימוש בשירות בתוך תקופה זו, אתה מבקש במפורש ביצוע מיידי ועשוי לאבד את זכות החזרה. כאשר הזכות עדיין חלה, פנה אלינו בכתובת <Email />.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. ניסיון חינמי</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אם מוצע ניסיון חינמי, לא תחויב במהלכו. בטל לפני תום הניסיון כדי להימנע מחיוב. חיובים לאחר המרת הניסיון למנוי בתשלום אינם ניתנים להחזר אוטומטי.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. חיובים חוזרים (Chargebacks)</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        לפני פתיחת הליך חיוב חוזר מול הבנק, פנה אלינו בכתובת <Email /> כדי שנוכל לנסות לפתור את הבעיה ישירות. חיובים חוזרים שלא נפתרו עשויים לגרום להשעיית חשבונך.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. שינויים במדיניות</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יועברו בהודעה באפליקציה או בדואר אלקטרוני.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. צור קשר</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>רונן וולפסברגר</strong></p>
        <p>רחוב הזבר 20, קדימה, ישראל</p>
        <p>תמיכה: <Email /></p>
        <p><a href="https://lessons-scheduler.com" className="text-blue-600 hover:underline">lessons-scheduler.com</a></p>
      </address>
    </article>
  );
}

export default function RefundPolicyPage() {
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
