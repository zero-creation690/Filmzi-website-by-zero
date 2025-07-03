export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-gray-600">© 2025 — Filmzi. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://t.me/filmzi2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Telegram: @filmzi
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
