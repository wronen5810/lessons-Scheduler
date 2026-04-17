import '../globals.css';

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800 font-sans antialiased">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <a href="https://lessons-scheduler.com" className="text-sm text-blue-600 hover:underline">
              ← Lessons Scheduler
            </a>
          </div>
          {children}
          <footer className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Ronen Wolfsberger · Lessons Scheduler ·{' '}
            <a href="https://privacy.lessons-scheduler.com" className="hover:underline">Privacy</a> ·{' '}
            <a href="https://termsofservice.lessons-scheduler.com" className="hover:underline">Terms</a> ·{' '}
            <a href="https://refundpolicy.lessons-scheduler.com" className="hover:underline">Refund Policy</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
