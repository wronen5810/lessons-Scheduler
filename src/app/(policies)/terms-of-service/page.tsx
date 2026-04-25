'use client';

import { useState } from 'react';

const EFFECTIVE_DATE_EN = 'April 17, 2026';
const EFFECTIVE_DATE_HE = '17 באפריל 2026';
const SUPPORT_EMAIL = 'support@saderot.com';

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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>Effective Date:</strong> {EFFECTIVE_DATE_EN}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>Last Updated:</strong> {EFFECTIVE_DATE_EN}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        These Terms of Service ("Terms") govern your access to and use of the saderOT application and related services (the "Service") provided by Ronen Wolfsberger ("we," "us," or "our").
      </p>
      <p className="text-gray-700 leading-relaxed mb-3">
        By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. Eligibility</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account. If you use the Service on behalf of an organization, you represent that you are authorized to bind it to these Terms.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. Account Registration</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You agree to provide accurate, current, and complete information during registration and to keep it updated. You are responsible for safeguarding your account credentials and for all activity under your account. Notify us immediately at <Email /> if you suspect unauthorized access.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. The Service</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        saderOT is an application that helps users schedule, manage, and track lessons, sessions, or appointments. We may add, modify, or remove features at our discretion.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. Subscriptions and Payments</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.1 Subscription Plans</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        The Service offers paid subscription plans. Plan details — including price, billing cycle, included features, and any free trial — are disclosed at the point of purchase.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.2 Billing</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Subscriptions are billed through <strong>Google Play Billing</strong> on Android or Stripe where permitted.</li>
        <li>By subscribing, you authorize us to charge the applicable fees to your selected payment method on each renewal.</li>
        <li>You are responsible for any applicable taxes.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.3 Auto-Renewal</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Subscriptions automatically renew at the end of each billing period until cancelled.</li>
        <li>You will be charged no earlier than 24 hours before the start of each new billing period.</li>
        <li>To avoid renewal, cancel at least 24 hours before the current period ends.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.4 Free Trials</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        If a free trial is offered, it converts to a paid subscription at the end of the trial unless cancelled. Only one free trial is available per user.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.5 Price Changes</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        We may change subscription prices with advance notice. Continued use after the effective date constitutes acceptance.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.6 Cancellation</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Google Play:</strong> Google Play app → Subscriptions → saderOT → Cancel.</li>
        <li><strong>Direct subscriptions:</strong> Settings → Subscription → Cancel, or email <Email />.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">Cancellation stops future renewals. You retain access through the end of the current paid period.</p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.7 Refunds</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        See our <a href="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</a> for details.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. Acceptable Use</h2>
      <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Use the Service for unlawful purposes or in violation of these Terms.</li>
        <li>Upload or share content that is infringing, defamatory, or harmful.</li>
        <li>Attempt to reverse-engineer, decompile, or bypass security measures.</li>
        <li>Interfere with or disrupt the Service or servers.</li>
        <li>Use automated means to access the Service without our written consent.</li>
        <li>Resell or commercially exploit the Service without authorization.</li>
        <li>Use the Service to spam, phish, or transmit malware.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. User Content</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You retain ownership of content you submit (lesson notes, student lists, schedules). By submitting, you grant us a limited license to host and display it solely to operate the Service. You are responsible for ensuring you have the right to submit it.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. Intellectual Property</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        The Service, including its software, design, logos, and trademarks, is owned by Ronen Wolfsberger or our licensors. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for personal or internal business use.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. Third-Party Services</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        The Service may integrate with third-party services (e.g., Google Calendar, payment processors). Use of third-party services is governed by their own terms. We are not responsible for third-party services.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. Termination</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you violate these Terms or if required by law.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>Your right to use the Service ends immediately upon termination.</li>
        <li>Sections that by nature survive termination (IP, disclaimers, liability) will survive.</li>
        <li>Prepaid fees are non-refundable except as required by law or our Refund Policy.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. Disclaimers</h2>
      <p className="text-sm text-gray-700 leading-relaxed mb-3 uppercase">
        The Service is provided "as is" and "as available" without warranties of any kind, including warranties of merchantability, fitness for a particular purpose, or uninterrupted operation.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. Limitation of Liability</h2>
      <p className="text-sm text-gray-700 leading-relaxed mb-3 uppercase">
        To the maximum extent permitted by law, Ronen Wolfsberger will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service. Our total liability will not exceed the greater of (a) amounts you paid us in the prior 12 months, or (b) USD $100.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. Indemnification</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        You agree to indemnify and hold Ronen Wolfsberger harmless from any claims, damages, and expenses arising from your User Content, your use of the Service, or your violation of these Terms.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. Changes to the Terms</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        We may update these Terms. If changes are material, we will notify you in-app or by email at least 14 days before they take effect. Continued use constitutes acceptance.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">14. Governing Law and Disputes</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        These Terms are governed by the laws of Israel. Disputes will be resolved in the competent courts of Israel.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">15. Miscellaneous</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Entire Agreement:</strong> these Terms, together with our Privacy Policy and Refund Policy, form the entire agreement between you and us.</li>
        <li><strong>Severability:</strong> if any provision is unenforceable, the remaining provisions stay in effect.</li>
        <li><strong>No Waiver:</strong> our failure to enforce a provision is not a waiver of it.</li>
        <li><strong>Assignment:</strong> you may not assign these Terms without our consent.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">16. Contact</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>Ronen Wolfsberger</strong></p>
        <p>20 Hazabar St., Kadima, Israel</p>
        <p>Support: <Email /></p>
        <p><a href="https://saderot.com" className="text-blue-600 hover:underline">saderot.com</a></p>
      </address>
    </article>
  );
}

function HebrewContent() {
  return (
    <article dir="rtl" lang="he">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">תנאי שימוש</h1>
      <p className="text-sm text-gray-500 mb-1"><strong>תאריך תחילת תוקף:</strong> {EFFECTIVE_DATE_HE}</p>
      <p className="text-sm text-gray-500 mb-8"><strong>עדכון אחרון:</strong> {EFFECTIVE_DATE_HE}</p>

      <p className="text-gray-700 leading-relaxed mb-3">
        תנאי שימוש אלה ("התנאים") מסדירים את גישתך ושימושך ביישום saderOT ובשירותים הקשורים אליו ("השירות") המסופקים על ידי רונן וולפסברגר ("אנחנו" או "שלנו").
      </p>
      <p className="text-gray-700 leading-relaxed mb-3">
        יצירת חשבון או שימוש בשירות מהווים הסכמה לתנאים אלה. אם אינך מסכים, אנא הימנע משימוש בשירות.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">1. כשירות</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        עליך להיות בן 18 לפחות, או בגיל הבגרות לפי שיפוטך, כדי ליצור חשבון ולהתקשר בתנאים אלה. אם אתה משתמש בשירות עבור ארגון, אתה מצהיר כי אתה מוסמך לחייב אותו בתנאים אלה.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">2. הרשמה לחשבון</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אתה מתחייב למסור מידע מדויק, עדכני ומלא בעת ההרשמה ולשמור עליו מעודכן. אתה אחראי לשמירה על פרטי הגישה לחשבונך ועל כל הפעילות תחתיו. הודע לנו מיד בכתובת <Email /> אם אתה חושד בגישה לא מורשית.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">3. השירות</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        saderOT הוא יישום המסייע למשתמשים לתזמן, לנהל ולעקוב אחר שיעורים ומפגשים. אנו רשאים להוסיף, לשנות או להסיר תכונות לפי שיקול דעתנו.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">4. מנויים ותשלומים</h2>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.1 תוכניות מנוי</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        השירות מציע תוכניות מנוי בתשלום. פרטי התוכנית — כולל מחיר, מחזור חיוב, תכונות כלולות וניסיון חינמי — יוצגו בנקודת הרכישה.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.2 חיוב</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>מנויים מחויבים דרך <strong>Google Play Billing</strong> באנדרואיד או דרך Stripe.</li>
        <li>בהרשמה למנוי, אתה מאשר לנו לחייב את אמצעי התשלום שבחרת בכל חידוש.</li>
        <li>אתה אחראי לכל מס חל.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.3 חידוש אוטומטי</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>מנויים מתחדשים אוטומטית בסיום כל תקופת חיוב עד לביטול.</li>
        <li>החיוב יתבצע לא לפני 24 שעות מתחילת תקופת החיוב החדשה.</li>
        <li>לביטול לפני החידוש, יש לבטל לפחות 24 שעות לפני סיום התקופה הנוכחית.</li>
      </ul>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.4 ניסיון חינמי</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        אם מוצע ניסיון חינמי, הוא יעבור למנוי בתשלום בסיום תקופת הניסיון אלא אם בוטל. ניסיון חינמי אחד בלבד זמין לכל משתמש.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.5 שינויי מחיר</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו עשויים לשנות מחירי מנוי עם הודעה מוקדמת. המשך שימוש לאחר תאריך התחולה מהווה הסכמה למחיר החדש.
      </p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.6 ביטול</h3>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>Google Play:</strong> אפליקציית Google Play ← מנויים ← saderOT ← בטל מנוי.</li>
        <li><strong>מנויים ישירים:</strong> הגדרות ← מנוי ← בטל, או שלח דואר אלקטרוני לכתובת <Email />.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mb-3">הביטול מפסיק חידושים עתידיים. הגישה לשירות נשמרת עד סוף תקופת החיוב השוטפת.</p>

      <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">4.7 החזרים</h3>
      <p className="text-gray-700 leading-relaxed mb-3">
        ראה את <a href="/refund-policy" className="text-blue-600 hover:underline">מדיניות ההחזרים</a> שלנו לפרטים.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">5. שימוש מותר</h2>
      <p className="text-gray-700 leading-relaxed mb-3">אתה מסכים שלא:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>להשתמש בשירות למטרות בלתי חוקיות או בניגוד לתנאים אלה.</li>
        <li>להעלות או לשתף תוכן מפר זכויות, משמיץ או מזיק.</li>
        <li>לנסות לבצע הנדסה לאחור, פענוח או עקיפה של אמצעי אבטחה.</li>
        <li>להפריע לשירות או לשרתים.</li>
        <li>להשתמש באמצעים אוטומטיים לגישה לשירות ללא הסכמתנו בכתב.</li>
        <li>למכור מחדש או לנצל את השירות מסחרית ללא אישור.</li>
        <li>להשתמש בשירות לדואר זבל, דיוג או הפצת תוכנות זדוניות.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">6. תוכן משתמש</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אתה שומר על בעלות התוכן שאתה מגיש לשירות (הערות שיעורים, רשימות תלמידים, לוחות זמנים). בהגשתו, אתה מעניק לנו רישיון מוגבל לאחסן ולהציג אותו לצורך הפעלת השירות. אתה אחראי לוודא שיש לך את הזכות להגיש תוכן זה.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">7. קניין רוחני</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        השירות, כולל תוכנה, עיצוב, לוגואים וסימני מסחר, שייך לרונן וולפסברגר או לבעלי רישיון. אנו מעניקים לך רישיון מוגבל, לא בלעדי, בלתי ניתן להעברה ושניתן לביטול לשימוש בשירות לצורך שימוש אישי או עסקי פנימי.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">8. שירותי צד שלישי</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        השירות עשוי להשתלב עם שירותי צד שלישי (כגון Google Calendar, מעבדי תשלומים). השימוש בהם כפוף לתנאים שלהם. איננו אחראים לשירותי צד שלישי.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">9. סיום</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        תוכל להפסיק להשתמש בשירות ולמחוק את חשבונך בכל עת. אנו רשאים להשעות או לסיים את גישתך אם הפרת תנאים אלה או אם נדרש על פי חוק.
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li>זכות השימוש שלך בשירות מסתיימת מיד עם הסיום.</li>
        <li>סעיפים שבטבעם אמורים להמשיך לאחר הסיום (כגון קניין רוחני, כתבי ויתור, אחריות) ימשיכו לחול.</li>
        <li>דמי מנוי ששולמו מראש אינם ניתנים להחזר אלא כנדרש בחוק או לפי מדיניות ההחזרים שלנו.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">10. כתבי ויתור</h2>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        השירות מסופק "כפי שהוא" ו"כפי שזמין" ללא אחריות מכל סוג, לרבות אחריות לסחירות, התאמה למטרה מסוימת, או פעולה רציפה ונטולת שגיאות.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">11. הגבלת אחריות</h2>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        במידה המרבית המותרת בחוק, רונן וולפסברגר לא יהיה אחראי לנזקים עקיפים, מקריים, מיוחדים, תוצאתיים או עונשיים הנובעים מהשימוש שלך בשירות. האחריות הכוללת שלנו לא תעלה על הסכום הגדול מבין: (א) הסכומים ששילמת לנו ב-12 החודשים שקדמו לתביעה, או (ב) 100 דולר.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">12. שיפוי</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אתה מסכים לשפות ולהגן על רונן וולפסברגר מכל תביעה, נזק והוצאות הנובעים מתוכן המשתמש שלך, מהשימוש שלך בשירות, או מהפרת תנאים אלה.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">13. שינויים בתנאים</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        אנו עשויים לעדכן תנאים אלה. אם השינויים מהותיים, נודיע לך באפליקציה או בדואר אלקטרוני לפחות 14 יום לפני שייכנסו לתוקף. המשך שימוש מהווה הסכמה לשינויים.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">14. הדין החל וסמכות שיפוט</h2>
      <p className="text-gray-700 leading-relaxed mb-3">
        תנאים אלה כפופים לחוקי מדינת ישראל. סכסוכים יוכרעו בבתי המשפט המוסמכים בישראל.
      </p>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">15. שונות</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-3">
        <li><strong>הסכם שלם:</strong> תנאים אלה, יחד עם מדיניות הפרטיות ומדיניות ההחזרים שלנו, מהווים את ההסכם המלא בינך לבינינו.</li>
        <li><strong>הפרדיות:</strong> אם הוראה כלשהי אינה ניתנת לאכיפה, יתר ההוראות יישארו בתוקף.</li>
        <li><strong>ויתור:</strong> אי-אכיפה של הוראה אינו מהווה ויתור עליה.</li>
        <li><strong>המחאה:</strong> אינך רשאי להמחות תנאים אלה ללא הסכמתנו.</li>
      </ul>

      <hr className="my-8 border-gray-200" />
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">16. צור קשר</h2>
      <address className="not-italic text-gray-700 space-y-1 leading-relaxed">
        <p><strong>רונן וולפסברגר</strong></p>
        <p>רחוב הצבר 20, קדימה, ישראל</p>
        <p>תמיכה: <Email /></p>
        <p><a href="https://saderot.com" className="text-blue-600 hover:underline">saderot.com</a></p>
      </address>
    </article>
  );
}

export default function TermsOfServicePage() {
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
