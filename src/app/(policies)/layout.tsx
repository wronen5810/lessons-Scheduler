import '../globals.css';

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="auto">
      <body className="bg-white text-gray-800 font-sans antialiased">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <a href="https://saderot.com" className="text-sm text-blue-600 hover:underline">
              ← saderOT
            </a>
          </div>
          {children}
          <footer className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Ronen Wolfsberger · saderOT ·{' '}
            <a href="https://privacy.saderot.com" className="hover:underline">Privacy</a> ·{' '}
            <a href="https://termsofservice.saderot.com" className="hover:underline">Terms</a> ·{' '}
            <a href="https://refundpolicy.saderot.com" className="hover:underline">Refund Policy</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
