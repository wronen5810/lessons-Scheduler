import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, TableOfContents, StyleLevel,
  NumberFormat, convertInchesToTwip, LevelFormat,
} from 'docx';
import { writeFileSync } from 'fs';

// ─── helpers ────────────────────────────────────────────────────────────────

function h1(text, rtl = false) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    bidirectional: rtl,
    spacing: { before: 320, after: 120 },
  });
}

function h2(text, rtl = false) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    bidirectional: rtl,
    spacing: { before: 240, after: 80 },
  });
}

function h3(text, rtl = false) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    bidirectional: rtl,
    spacing: { before: 200, after: 60 },
  });
}

function body(text, rtl = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bidirectional: rtl,
    spacing: { after: 60 },
  });
}

function bold(label, rest = '', rtl = false) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22 }),
      ...(rest ? [new TextRun({ text: rest, size: 22 })] : []),
    ],
    bidirectional: rtl,
    spacing: { after: 60 },
  });
}

function bullet(text, rtl = false, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    bidirectional: rtl,
    spacing: { after: 40 },
  });
}

function numberedStep(text, rtl = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    numbering: { reference: 'numbered-steps', level: 0 },
    bidirectional: rtl,
    spacing: { after: 40 },
  });
}

function blank() {
  return new Paragraph({ text: '', spacing: { after: 60 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function titlePage(title, subtitle, rtl = false) {
  return [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 56, color: '1E3A5F' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 240 },
      bidirectional: rtl,
    }),
    new Paragraph({
      children: [new TextRun({ text: subtitle, size: 28, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
      bidirectional: rtl,
    }),
  ];
}

// ─── ENGLISH document ────────────────────────────────────────────────────────

function buildEnglish() {
  const R = false;
  const paras = [
    ...titlePage('Lessons Scheduler', 'User Guide', R),
    pageBreak(),

    // ── TEACHER ──
    h1('TEACHER GUIDE', R),

    h2('1. Logging In', R),
    numberedStep('Go to /teacher (the teacher login page).', R),
    numberedStep('Enter your email and password, then press Sign in.', R),
    numberedStep('If Two-Factor Authentication (2FA) is enabled, enter the 6-digit code from your authenticator app.', R),
    blank(),

    h2('2. Schedule — Week & Month View', R),
    h3('Switching between Week and Month view', R),
    bullet('Press the Week / Month toggle button (top-right area of the calendar).', R),
    bullet('On large screens the Month view is the default; on mobile the Week view is the default.', R),
    blank(),
    h3('Navigating dates', R),
    bullet('Press the ← / → arrow buttons to move to the previous or next week/month.', R),
    bullet('Press Today (appears when viewing a different period) to jump back to the current week/month.', R),
    bullet('On mobile, swipe left/right on the calendar to navigate weeks.', R),
    blank(),
    h3('Showing or hiding events', R),
    bullet('Press the 📅 Events toggle button. A checkmark (✓) means events are visible.', R),
    blank(),
    h3('Viewing the calendar as a specific student', R),
    bullet('Use the "View as student" dropdown in the controls bar to pick a student.', R),
    bullet('The calendar will filter to show only that student\'s booked lessons and assigned events.', R),
    bullet('A blue banner appears at the top. Press × on the banner to exit student view.', R),
    blank(),
    h3('Refreshing data', R),
    bullet('Press the ↺ (refresh) button to reload all slots and events.', R),
    blank(),

    h2('3. Adding a Lesson Slot', R),
    h3('From the calendar (week view)', R),
    numberedStep('In the day column header, press the small + button.', R),
    numberedStep('The Add Slot Wizard opens. Choose One-time (single date) or Recurring (repeats weekly).', R),
    numberedStep('Set the date, start time, duration, and maximum number of students.', R),
    numberedStep('Optionally add a title. Press Save.', R),
    blank(),
    h3('From the calendar (month view)', R),
    numberedStep('Click the + button in the top corner of any day cell.', R),
    blank(),

    h2('4. Managing Booking Requests', R),
    body('The Pending Requests panel appears at the top of the Schedule page. It shows three request types:', R),
    blank(),
    bold('New student access request (purple dot):', R),
    bullet('Press Add Student to approve and add the student to your roster.', R),
    bullet('Press Dismiss to reject.', R),
    blank(),
    bold('Lesson booking request (amber dot):', R),
    bullet('Press Approve to confirm the lesson.', R),
    bullet('Press Reject to decline.', R),
    blank(),
    bold('Cancellation request (orange dot):', R),
    bullet('Press Approve cancellation to allow the cancellation.', R),
    bullet('Press Deny to keep the booking active.', R),
    blank(),

    h2('5. Slot Actions', R),
    body('Click on any slot in the calendar to open the Slot Panel.', R),
    blank(),
    bold('Available slot:'),
    bullet('Book for student — manually book a student into this slot.', R),
    bullet('Block this slot — mark as unavailable for this specific date.', R),
    blank(),
    bold('Blocked slot:'),
    bullet('Unblock this slot — removes the block.', R),
    blank(),
    bold('Pending slot:'),
    bullet('Approve — confirms the booking.', R),
    bullet('Reject — declines the booking.', R),
    blank(),
    bold('Confirmed slot:'),
    bullet('Mark as Completed — marks the lesson as done.', R),
    bullet('Set end date (recurring) / Cancel booking (one-time).', R),
    blank(),
    bold('Completed slot:'),
    bullet('Mark as Paid — records payment.', R),
    bullet('Revert to Approved — moves back to confirmed state.', R),
    blank(),
    bold('Cancellation requested:'),
    bullet('Approve cancellation — confirms the student\'s request.', R),
    bullet('Deny (keep booking) — rejects the cancellation.', R),
    blank(),
    h3('Editing a slot', R),
    numberedStep('In the Slot Panel, press Edit slot.', R),
    numberedStep('Change the start time, duration, title, or max students.', R),
    numberedStep('For recurring slots, set an end date to stop the recurrence.', R),
    numberedStep('Press Save.', R),
    blank(),
    h3('Deleting a slot', R),
    numberedStep('In the Slot Panel, press Edit slot to expand the section.', R),
    numberedStep('Press Delete slot (or Delete recurring slot).', R),
    numberedStep('Confirm in the dialog.', R),
    blank(),

    h2('6. Lesson Notes', R),
    h3('Adding a note', R),
    numberedStep('Open the Slot Panel for a booked slot.', R),
    numberedStep('Scroll to the Notes section.', R),
    numberedStep('Type your note in the text area.', R),
    numberedStep('Check Visible to student if you want the student to see it.', R),
    numberedStep('Press Add note.', R),
    blank(),
    h3('Editing note visibility', R),
    bullet('Press the Visible / Hidden toggle button next to any existing note.', R),
    blank(),
    h3('Deleting a note', R),
    bullet('Press the red Delete button next to the note.', R),
    blank(),

    h2('7. Calendar Events', R),
    body('Events are non-lesson items (exams, tasks, paperwork, vacations, etc.) shown on the calendar.', R),
    blank(),
    h3('Adding an event', R),
    bold('From the week view:', R),
    numberedStep('In any day column header, press the 📅 button (turns orange on hover).', R),
    numberedStep('The Add Event modal opens, pre-filled with that day\'s date.', R),
    blank(),
    bold('From the month view:', R),
    numberedStep('Press the 📅 button in the top corner of any day cell.', R),
    blank(),
    bold('From the mobile view:', R),
    numberedStep('In the selected day\'s section, press the 📅 Add Event button.', R),
    blank(),
    h3('Filling in the event form', R),
    numberedStep('Event Type — choose from Exam, Task, Paperwork, Vacation, or Other.', R),
    numberedStep('Description — enter a short description (required).', R),
    numberedStep('Start date / Start time — set when the event begins. Time is optional.', R),
    numberedStep('End date / End time — set when the event ends. For multi-day events (e.g. a 5-day vacation), the event will appear on every day in the range.', R),
    numberedStep('Assign students — choose No students (teacher-only), Specific students (checkbox list), or All of grade (1–12).', R),
    numberedStep('Set reminder — check this box to send a reminder to assigned students. Enter how many days before the event, and choose channels: Email, WhatsApp, Push.', R),
    numberedStep('Press Save Event.', R),
    blank(),
    h3('Deleting an event', R),
    numberedStep('Click the event chip to open the detail panel.', R),
    numberedStep('Press 🗑 Delete and confirm.', R),
    blank(),

    h2('8. Students', R),
    h3('Adding a student', R),
    numberedStep('Fill in the Name (required), Email, Phone, and Grade fields at the top of the Students page.', R),
    numberedStep('Press Add.', R),
    blank(),
    h3('Editing a student', R),
    numberedStep('Press the ⋮ (three-dot) menu next to the student.', R),
    numberedStep('Press ✏️ Edit.', R),
    numberedStep('Update the fields and press Save.', R),
    blank(),
    h3('Changing a student\'s status', R),
    bullet('Press the status badge next to the student name and select the new status.', R),
    blank(),
    h3('Recording a payment', R),
    numberedStep('Press ⋮ → 💰 Record payment.', R),
    numberedStep('Enter the amount and an optional note (e.g. "Cash").', R),
    numberedStep('Press Save payment.', R),
    blank(),
    h3('Filtering students', R),
    bullet('Use the All / Active / Waiting filter buttons at the top of the list.', R),
    blank(),

    h2('9. Student Groups', R),
    body('Groups are available only if the Groups feature is enabled in Settings.', R),
    blank(),
    h3('Creating a group', R),
    numberedStep('Go to Students → Groups tab.', R),
    numberedStep('Enter a Group name and optional Rate per lesson.', R),
    numberedStep('Press Create.', R),
    blank(),
    h3('Adding members to a group', R),
    numberedStep('Press ⋮ → 👥 Members next to the group.', R),
    numberedStep('Use the Add member dropdown to select a student.', R),
    blank(),

    h2('10. Messages', R),
    bullet('Go to the Messages page from the main menu to see all conversations.', R),
    bullet('Click a student to open their thread.', R),
    bullet('Type in the compose box and press Send.', R),
    blank(),

    h2('11. Settings', R),
    body('Press the Settings (⚙) icon to open the settings panel.', R),
    blank(),
    h3('General tab', R),
    bullet('Default lesson duration — sets the default minutes when creating new slots.', R),
    bullet('Time format — switch between 24-hour and 12-hour display.', R),
    bullet('Language — switch between Hebrew and English.', R),
    bullet('Auto-approve students — new access requests are approved automatically when enabled.', R),
    bullet('Feature toggles — enable/disable Billing, Messages, Groups, Notebook, Student Cancellation.', R),
    bullet('Notification preferences — choose which events trigger email, WhatsApp, or push notifications.', R),
    bullet('Two-Factor Authentication — press Enable 2FA, scan the QR code with Google Authenticator, enter the 6-digit code, and press Activate.', R),
    bullet('Calendar Sync — press Generate calendar link to get a URL to subscribe to in Google/Apple/Outlook Calendar.', R),
    blank(),
    h3('Profile tab', R),
    bullet('Update your name, phone, area of tutoring, quote, photo, description, bio, and page color.', R),
    bullet('Check Show on page next to any field to make it visible to students on your booking page.', R),
    blank(),
    h3('Export tab', R),
    bullet('Press Download for Excel to download all data (students, lessons, billing, notebook) as a .xlsx file.', R),
    blank(),

    pageBreak(),

    // ── STUDENT ──
    h1('STUDENT GUIDE', R),

    h2('12. Accessing the Portal', R),
    h3('First-time login', R),
    numberedStep('Go to your teacher\'s booking link (e.g. /t/[teacherID]).', R),
    numberedStep('Press the Menu button → Go to portal, or follow the link your teacher provided.', R),
    numberedStep('Enter your email address. A link or code will be sent to you.', R),
    numberedStep('Click the link (or enter the code) to log in.', R),
    blank(),
    h3('Multiple teachers', R),
    bullet('If you are registered with more than one teacher, a row of buttons appears at the top.', R),
    bullet('Press a teacher\'s name to switch the portal to that teacher\'s content.', R),
    blank(),

    h2('13. Booking a Lesson', R),
    numberedStep('In the Schedule tab, press the blue Book lesson button at the top.', R),
    numberedStep('Dates with available slots are highlighted in amber on the calendar.', R),
    numberedStep('Press an available date to see available times.', R),
    numberedStep('Press a time slot to select it.', R),
    numberedStep('Choose For myself or a Group (if applicable), and One-time or Recurring.', R),
    numberedStep('Press Submit booking request. Your teacher will confirm it.', R),
    blank(),

    h2('14. Requesting Cancellation', R),
    body('Only available if your teacher has enabled student cancellations.', R),
    numberedStep('In the Schedule tab, find the lesson you want to cancel.', R),
    numberedStep('Press Request cancellation (red link below the lesson).', R),
    numberedStep('For recurring lessons: choose a last lesson date and optionally enter a reason.', R),
    numberedStep('For one-time lessons: confirm the cancellation.', R),
    numberedStep('Press Cancel lesson.', R),
    blank(),

    h2('15. Events', R),
    body('Events are shown in the Upcoming Events section at the bottom of the Schedule tab.', R),
    blank(),
    h3('Viewing events', R),
    bullet('Events assigned to you by your teacher appear automatically.', R),
    blank(),
    h3('Adding a personal event', R),
    numberedStep('In the Upcoming Events section, press + Add Event.', R),
    numberedStep('Select an Event type.', R),
    numberedStep('Enter a Description.', R),
    numberedStep('Set the Start date, optional Start time, End date, and optional End time.', R),
    numberedStep('Press Save. The event also appears on your teacher\'s calendar.', R),
    blank(),

    h2('16. Messages', R),
    numberedStep('Go to the Messages tab.', R),
    numberedStep('Type a message in the text area at the bottom.', R),
    numberedStep('Press Send message.', R),
    blank(),

    h2('17. Notebook', R),
    bullet('Go to the Notebook tab.', R),
    bullet('View notes and assignments left by your teacher.', R),
    bullet('You can also write your own notes here.', R),
    blank(),

    h2('18. Settings', R),
    numberedStep('Go to the Settings tab.', R),
    numberedStep('Update your email address and phone number.', R),
    numberedStep('Press Save.', R),
    blank(),
    h3('Two-Factor Authentication', R),
    numberedStep('In the Settings tab, find the Two-Factor Authentication section.', R),
    numberedStep('Press Enable 2FA.', R),
    numberedStep('Scan the QR code with Google Authenticator.', R),
    numberedStep('Enter the 6-digit code shown in the app.', R),
    numberedStep('Press Activate.', R),
    blank(),
  ];

  return new Document({
    numbering: {
      config: [{
        reference: 'numbered-steps',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 36, bold: true, color: '1E3A5F' },
          paragraph: { spacing: { before: 320, after: 120 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 28, bold: true, color: '2563EB' },
          paragraph: { spacing: { before: 240, after: 80 } },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 24, bold: true, color: '374151' },
          paragraph: { spacing: { before: 200, after: 60 } },
        },
      ],
    },
    sections: [{ properties: {}, children: paras }],
  });
}

// ─── HEBREW document ─────────────────────────────────────────────────────────

function buildHebrew() {
  const R = true;
  const paras = [
    ...titlePage('מערכת ניהול שיעורים', 'מדריך למשתמש', R),
    pageBreak(),

    // ── TEACHER ──
    h1('מדריך למורה', R),

    h2('1. כניסה למערכת', R),
    numberedStep('עבור לדף הכניסה של המורה /teacher.', R),
    numberedStep('הזן את כתובת הדוא"ל והסיסמה שלך, ולחץ כניסה.', R),
    numberedStep('אם הפעלת אימות דו-שלבי (2FA), הזן את הקוד בן 6 הספרות מאפליקציית האימות.', R),
    blank(),

    h2('2. לוח שנה — תצוגת שבוע וחודש', R),
    h3('מעבר בין תצוגת שבוע לחודש', R),
    bullet('לחץ על לחצן שבוע / חודש (פינה עליונה-ימנית של הלוח).', R),
    bullet('במסכים גדולים ברירת המחדל היא תצוגת חודש; בנייד — תצוגת שבוע.', R),
    blank(),
    h3('ניווט בין תאריכים', R),
    bullet('לחץ על לחצני ← / → כדי לעבור לשבוע/חודש הקודם או הבא.', R),
    bullet('לחץ היום (מופיע כשגולשים לתקופה אחרת) כדי לחזור לשבוע/חודש הנוכחי.', R),
    bullet('בנייד, החלק שמאלה/ימינה על הלוח כדי לנווט בין שבועות.', R),
    blank(),
    h3('הצגה או הסתרה של אירועים', R),
    bullet('לחץ על לחצן 📅 אירועים. סימן וי (✓) מציין שהאירועים גלויים.', R),
    blank(),
    h3('צפייה בלוח כתלמיד מסוים', R),
    bullet('השתמש בתפריט הנפתח "צפה כתלמיד" בסרגל הכלים לבחירת תלמיד.', R),
    bullet('הלוח יסנן ויציג רק את השיעורים והאירועים של אותו תלמיד.', R),
    bullet('סרט כחול יופיע בחלק העליון. לחץ × בסרט כדי לצאת מתצוגת התלמיד.', R),
    blank(),
    h3('רענון הנתונים', R),
    bullet('לחץ על לחצן ↺ (רענון) כדי לטעון מחדש את כל החריצים והאירועים.', R),
    blank(),

    h2('3. הוספת חריץ שיעור', R),
    h3('מתצוגת שבוע', R),
    numberedStep('בכותרת עמודת היום, לחץ על לחצן + הקטן.', R),
    numberedStep('אשף הוספת חריץ נפתח. בחר חד-פעמי (תאריך יחיד) או קבוע (חוזר שבועית).', R),
    numberedStep('קבע תאריך, שעת התחלה, משך השיעור ומספר התלמידים המרבי.', R),
    numberedStep('אפשרות: הוסף כותרת. לחץ שמור.', R),
    blank(),
    h3('מתצוגת חודש', R),
    numberedStep('לחץ על לחצן + בפינה העליונה של תא יום כלשהו.', R),
    blank(),

    h2('4. ניהול בקשות הזמנה', R),
    body('לוח הבקשות הממתינות מופיע בחלק העליון של דף לוח השנה. שלושה סוגי בקשות:', R),
    blank(),
    bold('בקשת גישה של תלמיד חדש (נקודה סגולה):', R),
    bullet('לחץ הוסף תלמיד לאישור והוספה אוטומטית.', R),
    bullet('לחץ דחה לדחייה.', R),
    blank(),
    bold('בקשת הזמנת שיעור (נקודה כתומה-בהירה):', R),
    bullet('לחץ אשר לאישור השיעור.', R),
    bullet('לחץ דחה לסירוב.', R),
    blank(),
    bold('בקשת ביטול (נקודה כתומה):', R),
    bullet('לחץ אשר ביטול לאישורו.', R),
    bullet('לחץ דחה לשמירת ההזמנה.', R),
    blank(),

    h2('5. פעולות על חריצים', R),
    body('לחץ על חריץ כלשהו בלוח כדי לפתוח את לוח החריץ.', R),
    blank(),
    bold('חריץ זמין:', R),
    bullet('הזמן עבור תלמיד — רשום תלמיד ידנית לחריץ.', R),
    bullet('חסום חריץ זה — סמן כלא זמין לתאריך ספציפי זה.', R),
    blank(),
    bold('חריץ חסום:', R),
    bullet('בטל חסימה — מסיר את החסימה.', R),
    blank(),
    bold('חריץ ממתין:', R),
    bullet('אשר — מאשר את ההזמנה.', R),
    bullet('דחה — דוחה את ההזמנה.', R),
    blank(),
    bold('חריץ מאושר:', R),
    bullet('סמן כהושלם — מסמן שהשיעור התקיים.', R),
    bullet('קבע תאריך סיום (קבוע) / בטל הזמנה (חד-פעמי).', R),
    blank(),
    bold('חריץ שהושלם:', R),
    bullet('סמן כשולם — רושם תשלום.', R),
    bullet('חזור למאושר — מחזיר למצב מאושר.', R),
    blank(),
    bold('חריץ עם בקשת ביטול:', R),
    bullet('אשר ביטול — מאשר את בקשת התלמיד.', R),
    bullet('דחה (שמור הזמנה) — דוחה את הביטול.', R),
    blank(),
    h3('עריכת חריץ', R),
    numberedStep('בלוח החריץ, לחץ ערוך חריץ.', R),
    numberedStep('שנה שעת התחלה, משך, כותרת או מספר תלמידים מרבי.', R),
    numberedStep('בחריצים קבועים: קבע תאריך סיום להפסקת החזרה.', R),
    numberedStep('לחץ שמור.', R),
    blank(),
    h3('מחיקת חריץ', R),
    numberedStep('בלוח החריץ, לחץ ערוך חריץ להרחבת הקטע.', R),
    numberedStep('לחץ מחק חריץ (או מחק חריץ קבוע).', R),
    numberedStep('אשר בחלון הדו-שיח.', R),
    blank(),

    h2('6. הערות שיעור', R),
    h3('הוספת הערה', R),
    numberedStep('פתח את לוח החריץ עבור חריץ מוזמן.', R),
    numberedStep('גלול לקטע הערות.', R),
    numberedStep('הקלד את ההערה בתיבת הטקסט.', R),
    numberedStep('סמן גלוי לתלמיד אם תרצה שהתלמיד יראה אותה.', R),
    numberedStep('לחץ הוסף הערה.', R),
    blank(),
    h3('שינוי נראות הערה', R),
    bullet('לחץ על לחצן גלוי / מוסתר ליד הערה קיימת.', R),
    blank(),
    h3('מחיקת הערה', R),
    bullet('לחץ על לחצן מחק האדום ליד ההערה.', R),
    blank(),

    h2('7. אירועי לוח שנה', R),
    body('אירועים הם פריטים שאינם שיעורים (בחינות, משימות, ניירת, חופשות וכד\') המופיעים בלוח.', R),
    blank(),
    h3('הוספת אירוע', R),
    bold('מתצוגת שבוע:', R),
    numberedStep('בכותרת עמודת יום כלשהו, לחץ על לחצן 📅 (מתחדד לכתום בהעברת עכבר).', R),
    numberedStep('חלון הוספת אירוע נפתח, מאוכלס מראש בתאריך אותו יום.', R),
    blank(),
    bold('מתצוגת חודש:', R),
    numberedStep('לחץ על לחצן 📅 בפינה העליונה של תא יום כלשהו.', R),
    blank(),
    bold('מתצוגת נייד:', R),
    numberedStep('בקטע היום הנבחר, לחץ על לחצן 📅 הוסף אירוע.', R),
    blank(),
    h3('מילוי טופס האירוע', R),
    numberedStep('סוג אירוע — בחר מבין: בחינה, משימה, ניירת, חופשה, אחר.', R),
    numberedStep('תיאור — הזן תיאור קצר (שדה חובה).', R),
    numberedStep('תאריך התחלה / שעת התחלה — קבע מתי האירוע מתחיל. השעה אופציונלית.', R),
    numberedStep('תאריך סיום / שעת סיום — קבע מתי האירוע מסתיים. לאירוע רב-יומי (כגון חופשה של 5 ימים), האירוע יופיע בכל יום בטווח.', R),
    numberedStep('שיוך תלמידים — ללא תלמידים, תלמידים ספציפיים (סימון מרשימה), או כל כיתה (א\'–י"ב).', R),
    numberedStep('קבע תזכורת — סמן תיבה זו לשליחת תזכורת. הזן ימים לפני האירוע ובחר ערוצים: דוא"ל, וואטסאפ, Push.', R),
    numberedStep('לחץ שמור אירוע.', R),
    blank(),
    h3('מחיקת אירוע', R),
    numberedStep('לחץ על צ\'יפ האירוע לפתיחת לוח הפרטים.', R),
    numberedStep('לחץ 🗑 מחק ואשר.', R),
    blank(),

    h2('8. תלמידים', R),
    h3('הוספת תלמיד', R),
    numberedStep('מלא את שדות שם (חובה), דוא"ל, טלפון וכיתה בחלק העליון של דף התלמידים.', R),
    numberedStep('לחץ הוסף.', R),
    blank(),
    h3('עריכת תלמיד', R),
    numberedStep('לחץ על תפריט ⋮ (שלוש נקודות) ליד התלמיד.', R),
    numberedStep('לחץ ✏️ ערוך.', R),
    numberedStep('עדכן את השדות ולחץ שמור.', R),
    blank(),
    h3('שינוי סטטוס תלמיד', R),
    bullet('לחץ על תג הסטטוס ליד שם התלמיד ובחר סטטוס חדש מהתפריט הנפתח.', R),
    blank(),
    h3('רישום תשלום', R),
    numberedStep('לחץ ⋮ ← 💰 רשום תשלום.', R),
    numberedStep('הזן את הסכום והערה אופציונלית (למשל "מזומן").', R),
    numberedStep('לחץ שמור תשלום.', R),
    blank(),
    h3('סינון תלמידים', R),
    bullet('השתמש בלחצני הסינון הכל / פעיל / ממתין בחלק העליון של הרשימה.', R),
    blank(),

    h2('9. קבוצות תלמידים', R),
    body('קבוצות זמינות רק אם תכונת קבוצות מופעלת בהגדרות.', R),
    blank(),
    h3('יצירת קבוצה', R),
    numberedStep('עבור לדף תלמידים ← לשונית קבוצות.', R),
    numberedStep('הזן שם קבוצה ומחיר לשיעור אופציונלי.', R),
    numberedStep('לחץ צור.', R),
    blank(),
    h3('הוספת חברים לקבוצה', R),
    numberedStep('לחץ ⋮ ← 👥 חברים ליד הקבוצה.', R),
    numberedStep('השתמש בתפריט הנפתח הוסף חבר לבחירת תלמיד.', R),
    blank(),

    h2('10. הודעות', R),
    bullet('עבור לדף הודעות מהתפריט הראשי לצפייה בכל השיחות.', R),
    bullet('לחץ על תלמיד לפתיחת השרשור שלו.', R),
    bullet('הקלד בתיבת הכתיבה ולחץ שלח.', R),
    blank(),

    h2('11. הגדרות', R),
    body('לחץ על סמל הגדרות (⚙) לפתיחת לוח ההגדרות.', R),
    blank(),
    h3('לשונית כללי', R),
    bullet('משך שיעור ברירת מחדל — קובע את הדקות כברירת מחדל ביצירת חריצים.', R),
    bullet('פורמט שעה — מעבר בין תצוגת 24 שעות ל-12 שעות.', R),
    bullet('שפה — מעבר בין עברית לאנגלית.', R),
    bullet('אישור אוטומטי של תלמידים — כשמופעל, בקשות גישה חדשות מאושרות אוטומטית.', R),
    bullet('החלפת תכונות — הפעלה/השבתה של חיוב, הודעות, קבוצות, מחברת, ביטול על ידי תלמיד.', R),
    bullet('העדפות התראות — בחר אילו אירועים מפעילים התראות דוא"ל, וואטסאפ או Push.', R),
    bullet('אימות דו-שלבי — לחץ הפעל 2FA, סרוק QR עם Google Authenticator, הזן קוד 6 ספרות ולחץ הפעל.', R),
    bullet('סנכרון לוח שנה — לחץ צור קישור לוח שנה לקבלת כתובת URL לסנכרון ב-Google/Apple/Outlook Calendar.', R),
    blank(),
    h3('לשונית פרופיל', R),
    bullet('עדכן שם, טלפון, תחום הוראה, ציטוט, תמונה, תיאור, ביוגרפיה וצבע דף.', R),
    bullet('סמן הצג בדף ליד כל שדה כדי להפוך אותו לגלוי לתלמידים בדף ההזמנה שלך.', R),
    blank(),
    h3('לשונית ייצוא', R),
    bullet('לחץ הורד ל-Excel להורדת כל הנתונים כקובץ .xlsx.', R),
    blank(),

    pageBreak(),

    // ── STUDENT ──
    h1('מדריך לתלמיד', R),

    h2('12. כניסה לפורטל', R),
    h3('כניסה ראשונה', R),
    numberedStep('עבור לקישור ההזמנה של המורה שלך (לדוגמה /t/[teacherID]).', R),
    numberedStep('לחץ על לחצן תפריט ← עבור לפורטל, או עקוב אחר הקישור שהמורה שלח.', R),
    numberedStep('הזן את כתובת הדוא"ל שלך. קישור או קוד יישלחו אליך.', R),
    numberedStep('לחץ על הקישור (או הזן את הקוד) כדי להתחבר.', R),
    blank(),
    h3('מספר מורים', R),
    bullet('אם אתה רשום אצל יותר ממורה אחד, שורת לחצנים תופיע בחלק העליון.', R),
    bullet('לחץ על שם המורה כדי לעבור לתוכן הפורטל של אותו מורה.', R),
    blank(),

    h2('13. הזמנת שיעור', R),
    numberedStep('בלשונית לוח זמנים, לחץ על לחצן הזמן שיעור הכחול בחלק העליון.', R),
    numberedStep('תאריכים עם חריצים זמינים מסומנים בצבע ענבר בלוח השנה.', R),
    numberedStep('לחץ על תאריך זמין לראיית השעות הזמינות.', R),
    numberedStep('לחץ על חריץ זמן לבחירתו.', R),
    numberedStep('בחר עבורי או קבוצה (אם רלוונטי), וחד-פעמי או קבוע.', R),
    numberedStep('לחץ שלח בקשת הזמנה. המורה יאשר אותה.', R),
    blank(),

    h2('14. בקשת ביטול', R),
    body('זמין רק אם המורה שלך אפשר ביטולים על ידי תלמידים.', R),
    numberedStep('בלשונית לוח זמנים, מצא את השיעור שברצונך לבטל.', R),
    numberedStep('לחץ בקש ביטול (קישור אדום מתחת לשיעור).', R),
    numberedStep('לשיעורים קבועים: בחר תאריך שיעור אחרון והזן סיבה אופציונלית.', R),
    numberedStep('לשיעורים חד-פעמיים: אשר את הביטול.', R),
    numberedStep('לחץ בטל שיעור.', R),
    blank(),

    h2('15. אירועים', R),
    body('אירועים מוצגים בקטע אירועים קרובים בתחתית לשונית לוח הזמנים.', R),
    blank(),
    h3('צפייה באירועים', R),
    bullet('אירועים שהמורה שייך אליך מופיעים אוטומטית.', R),
    blank(),
    h3('הוספת אירוע אישי', R),
    numberedStep('בקטע אירועים קרובים, לחץ + הוסף אירוע.', R),
    numberedStep('בחר סוג אירוע.', R),
    numberedStep('הזן תיאור.', R),
    numberedStep('קבע תאריך התחלה, שעת התחלה אופציונלית, תאריך סיום ושעת סיום אופציונלית.', R),
    numberedStep('לחץ שמור. האירוע יופיע גם בלוח השנה של המורה שלך.', R),
    blank(),

    h2('16. הודעות', R),
    numberedStep('עבור ללשונית הודעות.', R),
    numberedStep('הקלד הודעה בתיבת הטקסט בתחתית.', R),
    numberedStep('לחץ שלח הודעה.', R),
    blank(),

    h2('17. מחברת', R),
    bullet('עבור ללשונית מחברת.', R),
    bullet('צפה בהערות ומשימות שהמורה שלך השאיר.', R),
    bullet('ניתן גם לכתוב הערות משלך כאן.', R),
    blank(),

    h2('18. הגדרות', R),
    numberedStep('עבור ללשונית הגדרות.', R),
    numberedStep('עדכן את כתובת הדוא"ל ומספר הטלפון שלך.', R),
    numberedStep('לחץ שמור.', R),
    blank(),
    h3('אימות דו-שלבי', R),
    numberedStep('בלשונית הגדרות, מצא את קטע אימות דו-שלבי.', R),
    numberedStep('לחץ הפעל 2FA.', R),
    numberedStep('סרוק את קוד ה-QR עם Google Authenticator.', R),
    numberedStep('הזן את קוד 6 הספרות המוצג באפליקציה.', R),
    numberedStep('לחץ הפעל.', R),
    blank(),
  ];

  return new Document({
    numbering: {
      config: [{
        reference: 'numbered-steps',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
        }],
      }],
    },
    styles: {
      default: {
        document: {
          run: { font: 'David', size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 36, bold: true, color: '1E3A5F' },
          paragraph: { spacing: { before: 320, after: 120 }, bidirectional: true },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 28, bold: true, color: '2563EB' },
          paragraph: { spacing: { before: 240, after: 80 }, bidirectional: true },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          run: { size: 24, bold: true, color: '374151' },
          paragraph: { spacing: { before: 200, after: 60 }, bidirectional: true },
        },
      ],
    },
    sections: [{ properties: {}, children: paras }],
  });
}

// ─── Write files ─────────────────────────────────────────────────────────────

const enDoc = buildEnglish();
const heDoc = buildHebrew();

const enBuffer = await Packer.toBuffer(enDoc);
const heBuffer = await Packer.toBuffer(heDoc);

writeFileSync('./docs/user-guide-en.docx', enBuffer);
writeFileSync('./docs/user-guide-he.docx', heBuffer);

console.log('Done: docs/user-guide-en.docx and docs/user-guide-he.docx');
