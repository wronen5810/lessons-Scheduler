'use client';

import type { ReceiptData } from '@/app/api/teacher/receipts/route';

function fmt(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ReceiptDocument({ data, lang = 'he' }: { data: ReceiptData; lang?: 'en' | 'he' }) {
  const isRTL = lang === 'he';
  const locale = isRTL ? 'he-IL' : 'en-US';

  const s: Record<string, React.CSSProperties> = {
    root: { fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", maxWidth: 480, width: '100%', margin: '0 auto', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', direction: isRTL ? 'rtl' : 'ltr' },
    header: { background: '#1e293b', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: 'white' },
    receiptMeta: { textAlign: isRTL ? 'left' : 'right', fontSize: 11 },
    receiptNum: { fontWeight: 700, fontSize: 13, marginBottom: 2 },
    receiptDate: { opacity: 0.7 },
    fromTo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 20px', background: '#f8fafc' },
    infoBox: { background: 'white', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' },
    infoLabel: { fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 5 },
    infoName: { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 },
    infoLine: { fontSize: 11, color: '#64748b', marginTop: 1 },
    amountWrap: { padding: '0 20px 16px' },
    amountBox: { background: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 },
    amountValue: { fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1 },
    amountBadge: { width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white' },
    detailsWrap: { padding: '0 20px 16px' },
    detailsLabel: { fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 },
    detailsTable: { border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
    detailsHead: { display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    detailsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', fontSize: 13, color: '#334155' },
    unallocBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' },
    unallocText: { color: '#166534', fontSize: 12, fontWeight: 500 },
    noteWrap: { padding: '0 20px 14px' },
    noteText: { fontSize: 12, color: '#64748b' },
    noteValue: { fontWeight: 600, color: '#334155' },
    thankyou: { padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #f0f0f0', textAlign: 'center' as const },
    thankyouText: { fontSize: 14, fontWeight: 600, color: '#334155' },
    footer: { padding: '10px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerBrand: { fontSize: 10, color: '#94a3b8' },
    footerDisclaimer: { fontSize: 9, color: '#cbd5e1' },
  };

  return (
    <div style={s.root} id="receipt-document">
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>SaderOT</div>
        <div style={s.receiptMeta}>
          <div style={s.receiptNum}>#{data.receipt_number}</div>
          <div style={s.receiptDate}>{fmt(data.payment.paid_at, locale)}</div>
        </div>
      </div>

      {/* From / To */}
      <div style={s.fromTo}>
        <div style={s.infoBox}>
          <div style={s.infoLabel}>{isRTL ? 'מ:' : 'From'}</div>
          <div style={s.infoName}>{data.teacher.name || (isRTL ? 'המורה' : 'Teacher')}</div>
          {data.teacher.phone && <div style={s.infoLine}>{data.teacher.phone}</div>}
          {data.teacher.email && <div style={s.infoLine}>{data.teacher.email}</div>}
          {data.teacher.tutoring_area && <div style={{ ...s.infoLine, color: '#94a3b8' }}>{data.teacher.tutoring_area}</div>}
        </div>
        <div style={s.infoBox}>
          <div style={s.infoLabel}>{isRTL ? 'אל:' : 'To'}</div>
          <div style={s.infoName}>{data.student.name || (isRTL ? 'התלמיד' : 'Student')}</div>
          {data.student.phone && <div style={s.infoLine}>{data.student.phone}</div>}
          {data.student.email && <div style={s.infoLine}>{data.student.email}</div>}
        </div>
      </div>

      {/* Amount */}
      <div style={s.amountWrap}>
        <div style={s.amountBox}>
          <div>
            <div style={s.amountLabel}>{isRTL ? 'סכום ששולם' : 'Amount Paid'}</div>
            <div style={s.amountValue}>₪{Number(data.payment.amount).toLocaleString()}</div>
          </div>
          <div style={s.amountBadge}>✓</div>
        </div>
      </div>

      {/* Details */}
      <div style={s.detailsWrap}>
        <div style={s.detailsLabel}>{isRTL ? 'פרטים' : 'Details'}</div>
        {data.lesson ? (
          <div style={s.detailsTable}>
            <div style={s.detailsHead}>
              <div>{isRTL ? 'תאריך' : 'Date'}</div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>{isRTL ? 'שעה' : 'Time'}</div>
            </div>
            <div style={s.detailsRow}>
              <div>{data.lesson.date}</div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>{data.lesson.start_time}–{data.lesson.end_time}</div>
            </div>
          </div>
        ) : (
          <div style={s.unallocBox}>
            <div style={s.unallocText}>{isRTL ? 'תשלום על חשבון שיעורים' : 'Payment toward lessons'}</div>
          </div>
        )}
      </div>

      {/* Payment method */}
      {data.payment.note && (
        <div style={s.noteWrap}>
          <span style={s.noteText}>{isRTL ? 'אמצעי תשלום: ' : 'Payment via: '}</span>
          <span style={s.noteValue}>{data.payment.note}</span>
        </div>
      )}

      {/* Thank you */}
      <div style={s.thankyou}>
        <div style={s.thankyouText}>{isRTL ? '🙏 תודה על התשלום!' : '🙏 Thank you for your payment!'}</div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerBrand}>
          Created with <strong>SaderOT</strong> · saderot.com
        </div>
        <div style={s.footerDisclaimer}>
          {isRTL ? 'אינה מהווה חשבונית מס' : 'Not an official tax invoice'}
        </div>
      </div>
    </div>
  );
}
