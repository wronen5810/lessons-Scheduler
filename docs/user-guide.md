# User Guide — Lessons Scheduler

---

# ENGLISH VERSION

---

## TABLE OF CONTENTS

### Teacher
1. [Logging In](#teacher-login)
2. [Schedule — Week & Month View](#schedule-view)
3. [Adding a Lesson Slot](#adding-slot)
4. [Managing Booking Requests](#booking-requests)
5. [Slot Actions (Approve, Complete, Pay, Cancel)](#slot-actions)
6. [Lesson Notes](#lesson-notes)
7. [Calendar Events](#calendar-events)
8. [Students](#students)
9. [Student Groups](#groups)
10. [Messages](#teacher-messages)
11. [Settings](#teacher-settings)

### Student
12. [Accessing the Portal](#student-access)
13. [Booking a Lesson](#booking-lesson)
14. [Requesting Cancellation](#student-cancel)
15. [Events](#student-events)
16. [Messages](#student-messages)
17. [Notebook](#notebook)
18. [Settings](#student-settings)

---

## TEACHER GUIDE

---

### 1. Logging In <a name="teacher-login"></a>

1. Go to `/teacher` (your app's teacher login page).
2. Enter your email and password, then press **Sign in**.
3. If Two-Factor Authentication (2FA) is enabled, enter the 6-digit code from your authenticator app.

---

### 2. Schedule — Week & Month View <a name="schedule-view"></a>

After logging in you land on the **Schedule** page.

**Switching between Week and Month view**
- Press the **Week / Month** toggle button (top-right area of the calendar).
- On large screens the Month view is the default; on mobile the Week view is default.

**Navigating dates**
- Press the **← / →** arrow buttons to move to the previous or next week/month.
- Press **Today** (appears when viewing a different period) to jump back to the current week/month.
- On mobile, you can **swipe left/right** on the calendar to navigate weeks.

**Showing or hiding events**
- Press the **📅 Events** toggle button. A checkmark (✓) means events are visible.

**Viewing the calendar as a specific student**
- Use the **"View as student"** dropdown in the controls bar to pick a student.
- The calendar will filter to show only that student's booked lessons and assigned events.
- A blue banner appears at the top. Press **×** on the banner to exit student view.

**Refreshing data**
- Press the **↺** (refresh) button to reload all slots and events.

---

### 3. Adding a Lesson Slot <a name="adding-slot"></a>

**From the calendar (week view)**
1. In the day column header, press the small **+** button.
2. The **Add Slot Wizard** opens. Follow the steps:
   - Choose **One-time** (single date) or **Recurring** (repeats weekly on that day).
   - Set the **date**, **start time**, **duration**, and **maximum number of students**.
   - Optionally add a **title**.
3. Press **Save**.

**From the calendar (month view)**
1. Click the **+** button in the top corner of any day cell.

---

### 4. Managing Booking Requests <a name="booking-requests"></a>

The **Pending Requests** panel appears at the top of the Schedule page (collapsible). It shows three types of requests:

**New student access request** (purple dot)
- A student is asking to join your roster.
- Press **Add Student** to approve and add them automatically.
- Press **Dismiss** to reject.

**Lesson booking request** (amber dot)
- A student has requested a specific time slot.
- Press **Approve** to confirm the lesson.
- Press **Reject** to decline.

**Cancellation request** (orange dot)
- A student is asking to cancel an existing lesson.
- Press **Approve cancellation** to allow it.
- Press **Deny** to keep the booking active.

---

### 5. Slot Actions <a name="slot-actions"></a>

Click on any slot in the calendar to open the **Slot Panel** on the right (or a modal on mobile).

**Available slot**
- **Book for student** — manually book a student into this slot.
- **Block this slot** — mark the slot as unavailable for this specific date (useful for cancelling a single occurrence of a recurring slot).

**Blocked slot**
- **Unblock this slot** — removes the block.

**Pending slot**
- **Approve** — confirms the booking.
- **Reject** — declines the booking.

**Confirmed slot**
- **Mark as Completed** — marks the lesson as done.
- **Set end date** (recurring) / **Cancel booking** (one-time) — ends or cancels the booking.

**Completed slot**
- **Mark as Paid** — records payment.
- **Revert to Approved** — moves back to confirmed state if needed.

**Cancellation requested slot**
- **Approve cancellation** — confirms the student's request.
- **Deny (keep booking)** — rejects the cancellation and keeps the lesson.

**Paid slot**
- **Revert to Completed** — moves back to completed state.

**Editing a slot**
1. In the Slot Panel, press **Edit slot**.
2. Change the **start time**, **duration**, **title**, or **max students**.
3. For recurring slots, you can also set an **end date** to stop the recurrence.
4. Press **Save**.

**Deleting a slot**
1. In the Slot Panel, press **Edit slot** to expand the section.
2. Press **Delete slot** (or **Delete recurring slot**).
3. Confirm in the dialog.

---

### 6. Lesson Notes <a name="lesson-notes"></a>

Notes are per-booking and appear at the bottom of the Slot Panel.

**Adding a note**
1. Open the Slot Panel for a booked slot.
2. Scroll to the **Notes** section.
3. Type your note in the text area.
4. Check **Visible to student** if you want the student to see it in their portal.
5. Press **Add note**.

**Editing note visibility**
- Press the **Visible / Hidden** toggle button next to any existing note to change whether the student can see it.

**Deleting a note**
- Press the red **Delete** button next to the note.

---

### 7. Calendar Events <a name="calendar-events"></a>

Events are non-lesson items (exams, tasks, paperwork, vacations, etc.) that appear on the calendar.

**Adding an event**

*From the week view:*
1. In any day column header, press the **📅** button (turns orange on hover).
2. The **Add Event** modal opens, pre-filled with that day's date.

*From the month view:*
1. Press the **📅** button in the top corner of any day cell.

*From the mobile view:*
1. In the selected day's section, press the **📅 Add Event** button.

**Filling in the event form**
1. **Event Type** — choose from Exam, Task, Paperwork, Vacation, or Other.
2. **Description** — enter a short description (required).
3. **Start date / Start time** — set when the event begins. Time is optional.
4. **End date / End time** — set when the event ends. For a multi-day event (e.g. a 5-day vacation), the event will appear on every day in the range.
5. **Assign students** — choose one of:
   - *No students* — the event is only visible to you.
   - *Specific students* — check the names from your student list.
   - *All of grade* — select a grade (1–12) to assign to all students in that grade.
6. **Set reminder** — check this box to send a reminder to assigned students before the event:
   - Enter how many **days before** the event to send the reminder.
   - Choose the **channels**: Email, WhatsApp, Push.
7. Press **Save Event**.

**Viewing event details**
- Click on any event chip in the calendar to open the **Event Detail** panel.
- It shows the date/time range, type, description, assigned students, and reminder info.

**Deleting an event**
1. Click the event chip to open the detail panel.
2. Press **🗑 Delete**.
3. Confirm in the dialog.

**Hiding all events**
- Press the **📅 Events** toggle button in the controls bar. Press again to show them.

---

### 8. Students <a name="students"></a>

Go to the **Students** page from the main menu.

**Adding a student**
1. Fill in the **Name** (required), **Email**, **Phone**, and **Grade** fields at the top of the page.
2. Press **Add**.

**Editing a student**
1. Press the **⋮** (three-dot) menu next to the student.
2. Press **✏️ Edit**.
3. Update the fields (name, email, phone, rate per lesson, grade, private notes).
4. Press **Save**.

**Changing a student's status**
- Press the status badge next to the student name (green = Active, amber = Waiting, gray = Inactive).
- Select the new status from the dropdown.

**Recording a payment**
1. Press the **⋮** menu → **💰 Record payment**.
2. Enter the **amount** and an optional **note** (e.g. "Cash").
3. Press **Save payment**.

**Managing student contacts**
1. Press **⋮** → **👤 Contacts**.
2. To add a contact: fill in name, relationship, email, phone, and press **Add Contact**.
3. To set a primary contact: press **Set as Primary**.
4. To edit or remove: use the **Edit** / **Remove** buttons.

**Filtering students**
- Use the **All / Active / Waiting** filter buttons at the top of the list.

**Removing a student**
1. Press **⋮** → **🗑 Remove**.
2. Confirm in the dialog.

---

### 9. Student Groups <a name="groups"></a>

Groups are only available if the **Groups** feature is enabled in Settings.

**Creating a group**
1. Go to **Students** → **Groups** tab.
2. Enter a **Group name** and optional **Rate per lesson** (total for the group).
3. Press **Create**.

**Adding members to a group**
1. Press **⋮** → **👥 Members** next to the group.
2. Use the **Add member** dropdown to select a student.
3. The student is added immediately.

**Editing a group**
1. Press **⋮** → **✏️ Edit**.
2. Change the name or rate.
3. Press **Save**.

**Deleting a group**
1. Press **⋮** → **🗑 Delete**.
2. Confirm in the dialog.

---

### 10. Messages <a name="teacher-messages"></a>

Messages are available if the feature is enabled in Settings.

- Go to the **Messages** page from the main menu to see all conversations.
- Click a student to open their thread.
- Type in the compose box and press **Send** to send a message.

---

### 11. Settings <a name="teacher-settings"></a>

Press the **Settings (⚙)** icon to open the settings panel.

**General tab**

- **Default lesson duration** — sets the default minutes when creating new slots.
- **Time format** — switch between 24-hour and 12-hour display.
- **Language** — switch between Hebrew and English.
- **Auto-approve students** — when enabled, new access requests are approved automatically.
- **Feature toggles** — enable/disable Billing, Messages, Groups, Notebook, Student Cancellation.
- **Notification preferences** — choose which events trigger email, WhatsApp, or push notifications.
- **Two-Factor Authentication** — press **Enable 2FA**, scan the QR code with Google Authenticator, enter the 6-digit code, and press **Activate**. To disable, press **Disable 2FA** and confirm with your current code.
- **Calendar Sync** — press **Generate calendar link** to get a URL you can subscribe to in Google Calendar, Apple Calendar, or Outlook.

**Profile tab**

- Update your **name**, **phone**, **area of tutoring**, **quote**, **photo**, **description**, **bio**, and **page color**. These items appear on your student-facing booking page.
- For each text field, check **Show on page** to make it visible to students.

**Export tab**

- Press **Download for Excel** to download all your data (students, lessons, billing, notebook) as a `.xlsx` file.

---

---

## STUDENT GUIDE

---

### 12. Accessing the Portal <a name="student-access"></a>

**First-time login**
1. Go to your teacher's booking link (e.g. `/t/[teacherID]`).
2. Press the **Menu** button → **Go to portal** or follow the link your teacher provided.
3. Enter your email address. A link or code will be sent to you.
4. Click the link (or enter the code) to log in.

**Returning login**
1. Go to `/student/portal` directly.
2. Your session is stored in the browser — you may be logged in automatically.

**Multiple teachers**
- If you are registered with more than one teacher, a row of buttons appears at the top.
- Press a teacher's name to switch the portal to that teacher's content.

---

### 13. Booking a Lesson <a name="booking-lesson"></a>

1. In the **Schedule** tab, press the blue **Book lesson** button at the top.
2. This opens your teacher's booking page.
3. Dates with available slots are highlighted in **amber** on the calendar.
4. Press an available date to see available times.
5. Press a time slot to select it.
6. Choose:
   - **For myself** or a **Group** (if you belong to a group).
   - **One-time** (just this session) or **Recurring** (every week at this time).
7. Press **Submit booking request**.
8. A confirmation screen appears: "Request sent!" Your teacher will approve it.

---

### 14. Requesting Cancellation <a name="student-cancel"></a>

*Only available if your teacher has enabled student cancellations.*

1. In the **Schedule** tab, find the lesson you want to cancel.
2. Press **Request cancellation** (red link below the lesson).
3. For recurring lessons: choose a **last lesson date** and optionally enter a **reason**.
4. For one-time lessons: confirm the cancellation.
5. Press **Cancel lesson**.
6. The status changes to "Cancellation requested" while your teacher reviews it.

---

### 15. Events <a name="student-events"></a>

Events are shown in the **Upcoming Events** section at the bottom of the Schedule tab.

**Viewing events**
- Events assigned to you by your teacher appear automatically.
- Events are shown with their type (exam, task, etc.), description, and date.

**Adding a personal event**
1. In the **Upcoming Events** section, press **+ Add Event**.
2. Select an **Event type**.
3. Enter a **Description**.
4. Set the **Start date**, optional **Start time**, **End date**, and optional **End time**.
5. Press **Save**.
6. The event is saved and will also appear on your teacher's calendar.

---

### 16. Messages <a name="student-messages"></a>

1. Go to the **Messages** tab.
2. Your conversation with your teacher is shown as a chat thread.
3. Type a message in the text area at the bottom.
4. Press **Send message**.

---

### 17. Notebook <a name="notebook"></a>

1. Go to the **Notebook** tab.
2. View notes and assignments left by your teacher.
3. You can also write your own notes here.

---

### 18. Settings <a name="student-settings"></a>

1. Go to the **Settings** tab.
2. Update your **email address** and **phone number**.
3. Press **Save**.

**Note:** If you change your email address, you will receive a new login link to the new address.

**Two-Factor Authentication**
1. In the Settings tab, find the **Two-Factor Authentication** section.
2. Press **Enable 2FA**.
3. Scan the QR code with Google Authenticator.
4. Enter the 6-digit code shown in the app.
5. Press **Activate**.
6. From now on, you will need the authenticator code to log in.

---

---
---

# גרסה בעברית

---

## תוכן עניינים

### מורה
1. [כניסה למערכת](#teacher-login-he)
2. [לוח שנה — תצוגת שבוע וחודש](#schedule-view-he)
3. [הוספת חריץ שיעור](#adding-slot-he)
4. [ניהול בקשות הזמנה](#booking-requests-he)
5. [פעולות על חריצים (אישור, השלמה, תשלום, ביטול)](#slot-actions-he)
6. [הערות שיעור](#lesson-notes-he)
7. [אירועי לוח שנה](#calendar-events-he)
8. [תלמידים](#students-he)
9. [קבוצות תלמידים](#groups-he)
10. [הודעות](#teacher-messages-he)
11. [הגדרות](#teacher-settings-he)

### תלמיד
12. [כניסה לפורטל](#student-access-he)
13. [הזמנת שיעור](#booking-lesson-he)
14. [בקשת ביטול](#student-cancel-he)
15. [אירועים](#student-events-he)
16. [הודעות](#student-messages-he)
17. [מחברת](#notebook-he)
18. [הגדרות](#student-settings-he)

---

## מדריך למורה

---

### 1. כניסה למערכת <a name="teacher-login-he"></a>

1. עבור לדף הכניסה של המורה `/teacher`.
2. הזן את כתובת הדוא"ל והסיסמה שלך, ולחץ **כניסה**.
3. אם הפעלת אימות דו-שלבי (2FA), הזן את הקוד בן 6 הספרות מאפליקציית האימות שלך.

---

### 2. לוח שנה — תצוגת שבוע וחודש <a name="schedule-view-he"></a>

לאחר הכניסה תגיע לדף **לוח השנה**.

**מעבר בין תצוגת שבוע לחודש**
- לחץ על לחצן **שבוע / חודש** (פינה עליונה-ימנית של הלוח).
- במסכים גדולים ברירת המחדל היא תצוגת חודש; בנייד ברירת המחדל היא תצוגת שבוע.

**ניווט בין תאריכים**
- לחץ על לחצני **← / →** כדי לעבור לשבוע/חודש הקודם או הבא.
- לחץ **היום** (מופיע כשגולשים לתקופה אחרת) כדי לחזור לשבוע/חודש הנוכחי.
- בנייד ניתן **להחליק שמאלה/ימינה** כדי לנווט בין שבועות.

**הצגה או הסתרה של אירועים**
- לחץ על לחצן **📅 אירועים**. סימן וי (✓) מציין שהאירועים גלויים.

**צפייה בלוח כתלמיד מסוים**
- השתמש בתפריט הנפתח **"צפה כתלמיד"** בסרגל הכלים לבחירת תלמיד.
- הלוח יסנן ויציג רק את השיעורים המוזמנים והאירועים המוקצים לאותו תלמיד.
- סרט כחול יופיע בחלק העליון. לחץ **×** בסרט כדי לצאת מתצוגת התלמיד.

**רענון הנתונים**
- לחץ על לחצן **↺** (רענון) כדי לטעון מחדש את כל החריצים והאירועים.

---

### 3. הוספת חריץ שיעור <a name="adding-slot-he"></a>

**מלוח השנה (תצוגת שבוע)**
1. בכותרת עמודת היום, לחץ על לחצן **+** הקטן.
2. אשף **הוספת חריץ** נפתח. עקוב אחר השלבים:
   - בחר **חד-פעמי** (תאריך יחיד) או **קבוע** (חוזר מדי שבוע באותו יום).
   - קבע את **התאריך**, **שעת ההתחלה**, **משך השיעור** ו**מספר התלמידים המרבי**.
   - אפשרות: הוסף **כותרת**.
3. לחץ **שמור**.

**מלוח השנה (תצוגת חודש)**
1. לחץ על לחצן **+** בפינה העליונה של תא יום כלשהו.

---

### 4. ניהול בקשות הזמנה <a name="booking-requests-he"></a>

לוח **בקשות ממתינות** מופיע בחלק העליון של דף לוח השנה (ניתן לכיווץ). הוא מציג שלושה סוגי בקשות:

**בקשת גישה של תלמיד חדש** (נקודה סגולה)
- תלמיד מבקש להצטרף לרשימת התלמידים שלך.
- לחץ **הוסף תלמיד** לאישור והוספה אוטומטית.
- לחץ **דחה** לדחייה.

**בקשת הזמנת שיעור** (נקודה כתומה-בהירה)
- תלמיד ביקש חריץ זמן מסוים.
- לחץ **אשר** לאישור השיעור.
- לחץ **דחה** לסירוב.

**בקשת ביטול** (נקודה כתומה)
- תלמיד מבקש לבטל שיעור קיים.
- לחץ **אשר ביטול** לאישורו.
- לחץ **דחה** לשמירת ההזמנה.

---

### 5. פעולות על חריצים <a name="slot-actions-he"></a>

לחץ על חריץ כלשהו בלוח כדי לפתוח את **לוח החריץ** מצד ימין (או חלון צף בנייד).

**חריץ זמין**
- **הזמן עבור תלמיד** — רשום תלמיד ידנית לחריץ זה.
- **חסום חריץ זה** — סמן את החריץ כלא זמין לתאריך ספציפי זה (שימושי לביטול מופע בודד של חריץ קבוע).

**חריץ חסום**
- **בטל חסימה** — מסיר את החסימה.

**חריץ ממתין**
- **אשר** — מאשר את ההזמנה.
- **דחה** — דוחה את ההזמנה.

**חריץ מאושר**
- **סמן כהושלם** — מסמן שהשיעור התקיים.
- **קבע תאריך סיום** (חוזר) / **בטל הזמנה** (חד-פעמי) — מסיים או מבטל את ההזמנה.

**חריץ שהושלם**
- **סמן כשולם** — רושם תשלום.
- **חזור למאושר** — מחזיר למצב מאושר אם יש צורך.

**חריץ עם בקשת ביטול**
- **אשר ביטול** — מאשר את בקשת התלמיד.
- **דחה (שמור הזמנה)** — דוחה את הביטול ומשאיר את השיעור.

**חריץ ששולם**
- **חזור להושלם** — מחזיר למצב הושלם.

**עריכת חריץ**
1. בלוח החריץ, לחץ **ערוך חריץ**.
2. שנה את **שעת ההתחלה**, **משך**, **כותרת** או **מספר תלמידים מרבי**.
3. בחריצים קבועים ניתן גם לקבוע **תאריך סיום** להפסקת החזרה.
4. לחץ **שמור**.

**מחיקת חריץ**
1. בלוח החריץ, לחץ **ערוך חריץ** להרחבת הקטע.
2. לחץ **מחק חריץ** (או **מחק חריץ קבוע**).
3. אשר בחלון הדו-שיח.

---

### 6. הערות שיעור <a name="lesson-notes-he"></a>

ההערות קשורות להזמנה ומופיעות בתחתית לוח החריץ.

**הוספת הערה**
1. פתח את לוח החריץ עבור חריץ מוזמן.
2. גלול לקטע **הערות**.
3. הקלד את ההערה בתיבת הטקסט.
4. סמן **גלוי לתלמיד** אם תרצה שהתלמיד יראה אותה בפורטל שלו.
5. לחץ **הוסף הערה**.

**שינוי נראות הערה**
- לחץ על לחצן **גלוי / מוסתר** ליד הערה קיימת כדי לשנות אם התלמיד יכול לראות אותה.

**מחיקת הערה**
- לחץ על לחצן **מחק** האדום ליד ההערה.

---

### 7. אירועי לוח שנה <a name="calendar-events-he"></a>

אירועים הם פריטים שאינם שיעורים (בחינות, משימות, ניירת, חופשות וכד') המופיעים בלוח השנה.

**הוספת אירוע**

*מתצוגת שבוע:*
1. בכותרת עמודת יום כלשהו, לחץ על לחצן **📅** (מתחדד לכתום בהעברת עכבר).
2. חלון **הוספת אירוע** נפתח, מאוכלס מראש בתאריך אותו יום.

*מתצוגת חודש:*
1. לחץ על לחצן **📅** בפינה העליונה של תא יום כלשהו.

*מתצוגת נייד:*
1. בקטע היום הנבחר, לחץ על לחצן **📅 הוסף אירוע**.

**מילוי טופס האירוע**
1. **סוג אירוע** — בחר מבין: בחינה, משימה, ניירת, חופשה, אחר.
2. **תיאור** — הזן תיאור קצר (שדה חובה).
3. **תאריך התחלה / שעת התחלה** — קבע מתי האירוע מתחיל. השעה אופציונלית.
4. **תאריך סיום / שעת סיום** — קבע מתי האירוע מסתיים. לאירוע רב-יומי (כגון חופשה של 5 ימים), האירוע יופיע בכל יום בטווח.
5. **שיוך תלמידים** — בחר אחד מהבאים:
   - *ללא תלמידים* — האירוע גלוי לך בלבד.
   - *תלמידים ספציפיים* — סמן שמות מרשימת התלמידים שלך.
   - *כל כיתה* — בחר כיתה (א'–י"ב) כדי לשייך לכל תלמידי הכיתה.
6. **קבע תזכורת** — סמן תיבה זו לשליחת תזכורת לתלמידים המשויכים לפני האירוע:
   - הזן כמה **ימים לפני** האירוע לשלוח את התזכורת.
   - בחר **ערוצים**: דוא"ל, וואטסאפ, Push.
7. לחץ **שמור אירוע**.

**צפייה בפרטי האירוע**
- לחץ על כל צ'יפ אירוע בלוח כדי לפתוח את לוח **פרטי האירוע**.
- הוא מציג את טווח התאריך/שעה, הסוג, התיאור, התלמידים המשויכים ופרטי התזכורת.

**מחיקת אירוע**
1. לחץ על צ'יפ האירוע לפתיחת לוח הפרטים.
2. לחץ **🗑 מחק**.
3. אשר בחלון הדו-שיח.

**הסתרת כל האירועים**
- לחץ על לחצן **📅 אירועים** בסרגל הכלים. לחץ שוב כדי להציגם.

---

### 8. תלמידים <a name="students-he"></a>

עבור לדף **תלמידים** מהתפריט הראשי.

**הוספת תלמיד**
1. מלא את שדות **שם** (חובה), **דוא"ל**, **טלפון** ו**כיתה** בחלק העליון של הדף.
2. לחץ **הוסף**.

**עריכת תלמיד**
1. לחץ על תפריט **⋮** (שלוש נקודות) ליד התלמיד.
2. לחץ **✏️ ערוך**.
3. עדכן את השדות (שם, דוא"ל, טלפון, מחיר לשיעור, כיתה, הערות פרטיות).
4. לחץ **שמור**.

**שינוי סטטוס תלמיד**
- לחץ על תג הסטטוס ליד שם התלמיד (ירוק = פעיל, כתום = ממתין, אפור = לא פעיל).
- בחר את הסטטוס החדש מהתפריט הנפתח.

**רישום תשלום**
1. לחץ **⋮** → **💰 רשום תשלום**.
2. הזן את **הסכום** ו**הערה** אופציונלית (למשל "מזומן").
3. לחץ **שמור תשלום**.

**ניהול אנשי קשר של תלמיד**
1. לחץ **⋮** → **👤 אנשי קשר**.
2. להוספת איש קשר: מלא שם, קשר, דוא"ל, טלפון ולחץ **הוסף איש קשר**.
3. לקביעת איש קשר ראשי: לחץ **קבע כראשי**.
4. לעריכה או הסרה: השתמש בלחצני **ערוך** / **הסר**.

**סינון תלמידים**
- השתמש בלחצני הסינון **הכל / פעיל / ממתין** בחלק העליון של הרשימה.

**הסרת תלמיד**
1. לחץ **⋮** → **🗑 הסר**.
2. אשר בחלון הדו-שיח.

---

### 9. קבוצות תלמידים <a name="groups-he"></a>

קבוצות זמינות רק אם תכונת **קבוצות** מופעלת בהגדרות.

**יצירת קבוצה**
1. עבור לדף **תלמידים** → לשונית **קבוצות**.
2. הזן **שם קבוצה** ואופציונלית **מחיר לשיעור** (סה"כ לקבוצה).
3. לחץ **צור**.

**הוספת חברים לקבוצה**
1. לחץ **⋮** → **👥 חברים** ליד הקבוצה.
2. השתמש בתפריט הנפתח **הוסף חבר** לבחירת תלמיד.
3. התלמיד מתווסף מיידית.

**עריכת קבוצה**
1. לחץ **⋮** → **✏️ ערוך**.
2. שנה את השם או המחיר.
3. לחץ **שמור**.

**מחיקת קבוצה**
1. לחץ **⋮** → **🗑 מחק**.
2. אשר בחלון הדו-שיח.

---

### 10. הודעות <a name="teacher-messages-he"></a>

הודעות זמינות אם התכונה מופעלת בהגדרות.

- עבור לדף **הודעות** מהתפריט הראשי כדי לראות את כל השיחות.
- לחץ על תלמיד לפתיחת השרשור שלו.
- הקלד בתיבת הכתיבה ולחץ **שלח** לשליחת הודעה.

---

### 11. הגדרות <a name="teacher-settings-he"></a>

לחץ על סמל **הגדרות (⚙)** לפתיחת לוח ההגדרות.

**לשונית כללי**

- **משך שיעור ברירת מחדל** — קובע את הדקות כברירת מחדל ביצירת חריצים חדשים.
- **פורמט שעה** — מעבר בין תצוגת 24 שעות ל-12 שעות.
- **שפה** — מעבר בין עברית לאנגלית.
- **אישור אוטומטי של תלמידים** — כשמופעל, בקשות גישה חדשות מאושרות אוטומטית.
- **החלפת תכונות** — הפעלה/השבתה של חיוב, הודעות, קבוצות, מחברת, ביטול על ידי תלמיד.
- **העדפות התראות** — בחר אילו אירועים מפעילים התראות דוא"ל, וואטסאפ או Push.
- **אימות דו-שלבי** — לחץ **הפעל 2FA**, סרוק את קוד ה-QR עם Google Authenticator, הזן את קוד 6 הספרות ולחץ **הפעל**. להשבתה, לחץ **השבת 2FA** ואשר עם הקוד הנוכחי שלך.
- **סנכרון לוח שנה** — לחץ **צור קישור לוח שנה** לקבלת כתובת URL שניתן להירשם אליה ב-Google Calendar, Apple Calendar או Outlook.

**לשונית פרופיל**

- עדכן את **שמך**, **טלפון**, **תחום ההוראה**, **ציטוט**, **תמונה**, **תיאור**, **ביוגרפיה** ו**צבע דף**. פריטים אלה מופיעים בדף הזמנת השיעורים שלך.
- לכל שדה טקסט, סמן **הצג בדף** כדי להפוך אותו לגלוי לתלמידים.

**לשונית ייצוא**

- לחץ **הורד ל-Excel** להורדת כל הנתונים שלך (תלמידים, שיעורים, חיוב, מחברת) כקובץ `.xlsx`.

---

---

## מדריך לתלמיד

---

### 12. כניסה לפורטל <a name="student-access-he"></a>

**כניסה ראשונה**
1. עבור לקישור ההזמנה של המורה שלך (לדוגמה `/t/[teacherID]`).
2. לחץ על לחצן **תפריט** ← **עבור לפורטל**, או עקוב אחרי הקישור שהמורה שלח לך.
3. הזן את כתובת הדוא"ל שלך. קישור או קוד יישלחו אליך.
4. לחץ על הקישור (או הזן את הקוד) כדי להתחבר.

**כניסה חוזרת**
1. עבור ישירות לכתובת `/student/portal`.
2. ייתכן שהפגישה שלך שמורה בדפדפן — ייתכן שתתחבר אוטומטית.

**מספר מורים**
- אם אתה רשום אצל יותר ממורה אחד, שורת לחצנים תופיע בחלק העליון.
- לחץ על שם המורה כדי לעבור לתוכן הפורטל של אותו מורה.

---

### 13. הזמנת שיעור <a name="booking-lesson-he"></a>

1. בלשונית **לוח זמנים**, לחץ על לחצן **הזמן שיעור** הכחול בחלק העליון.
2. דף ההזמנה של המורה שלך נפתח.
3. תאריכים עם חריצים זמינים מסומנים בצבע **ענבר** בלוח השנה.
4. לחץ על תאריך זמין כדי לראות שעות זמינות.
5. לחץ על חריץ זמן לבחירתו.
6. בחר:
   - **עבורי** או **קבוצה** (אם אתה חלק מקבוצה).
   - **חד-פעמי** (מפגש זה בלבד) או **קבוע** (כל שבוע בשעה זו).
7. לחץ **שלח בקשת הזמנה**.
8. מסך אישור מופיע: "הבקשה נשלחה!" המורה שלך יאשר אותה.

---

### 14. בקשת ביטול <a name="student-cancel-he"></a>

*זמין רק אם המורה שלך אפשר ביטולים על ידי תלמידים.*

1. בלשונית **לוח זמנים**, מצא את השיעור שברצונך לבטל.
2. לחץ **בקש ביטול** (קישור אדום מתחת לשיעור).
3. לשיעורים קבועים: בחר **תאריך שיעור אחרון** ואופציונלית הזן **סיבה**.
4. לשיעורים חד-פעמיים: אשר את הביטול.
5. לחץ **בטל שיעור**.
6. הסטטוס משתנה ל"בקשת ביטול" בזמן שהמורה בודק אותה.

---

### 15. אירועים <a name="student-events-he"></a>

אירועים מוצגים בקטע **אירועים קרובים** בתחתית לשונית לוח הזמנים.

**צפייה באירועים**
- אירועים שהמורה שייך אליך מופיעים אוטומטית.
- אירועים מוצגים עם הסוג שלהם (בחינה, משימה וכד'), תיאור ותאריך.

**הוספת אירוע אישי**
1. בקטע **אירועים קרובים**, לחץ **+ הוסף אירוע**.
2. בחר **סוג אירוע**.
3. הזן **תיאור**.
4. קבע **תאריך התחלה**, **שעת התחלה** אופציונלית, **תאריך סיום** ו**שעת סיום** אופציונלית.
5. לחץ **שמור**.
6. האירוע נשמר ויופיע גם בלוח השנה של המורה שלך.

---

### 16. הודעות <a name="student-messages-he"></a>

1. עבור ללשונית **הודעות**.
2. השיחה שלך עם המורה מוצגת כשרשור צ'אט.
3. הקלד הודעה בתיבת הטקסט בתחתית.
4. לחץ **שלח הודעה**.

---

### 17. מחברת <a name="notebook-he"></a>

1. עבור ללשונית **מחברת**.
2. צפה בהערות ומשימות שהמורה שלך השאיר.
3. ניתן גם לכתוב הערות משלך כאן.

---

### 18. הגדרות <a name="student-settings-he"></a>

1. עבור ללשונית **הגדרות**.
2. עדכן את **כתובת הדוא"ל** ו**מספר הטלפון** שלך.
3. לחץ **שמור**.

**שים לב:** אם תשנה את כתובת הדוא"ל שלך, תקבל קישור כניסה חדש לכתובת החדשה.

**אימות דו-שלבי**
1. בלשונית הגדרות, מצא את קטע **אימות דו-שלבי**.
2. לחץ **הפעל 2FA**.
3. סרוק את קוד ה-QR עם Google Authenticator.
4. הזן את קוד 6 הספרות המוצג באפליקציה.
5. לחץ **הפעל**.
6. מכאן ואילך תזדקק לקוד האימות כדי להתחבר.

---
