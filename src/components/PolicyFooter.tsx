import Link from 'next/link';

export default function PolicyFooter() {
  return (
    <footer className="mt-8 pb-6 text-center">
      <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
        <Link href="/privacy" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Privacy Policy
        </Link>
        <span className="text-gray-200 select-none">·</span>
        <Link href="/terms-of-service" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Terms of Service
        </Link>
        <span className="text-gray-200 select-none">·</span>
        <Link href="/refund-policy" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Refund Policy
        </Link>
      </div>
    </footer>
  );
}
