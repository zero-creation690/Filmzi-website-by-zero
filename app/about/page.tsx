import { Shield, Zap, Download, Heart } from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Lightning Fast",
      description: "Direct download links with no waiting time or speed limits.",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Ad-Free Experience",
      description: "Clean interface with no popups, redirects, or annoying advertisements.",
    },
    {
      icon: <Download className="h-8 w-8 text-purple-600" />,
      title: "Multiple Qualities",
      description: "Download movies in 480p, 720p, and 1080p HD quality.",
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Always Free",
      description: "All movies are completely free to download and stream forever.",
    },
  ]

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-black">About Filmzi</h1>
          <p className="text-xl text-gray-600">Download Movies. Free. Direct. Forever.</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-4 mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold text-black">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* About Content */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-black">What is Filmzi?</h2>
          <p className="text-gray-700">
            Filmzi is a premium movie downloading platform that provides direct access to the latest movies in multiple
            qualities. Our mission is to offer a clean, fast, and ad-free experience for movie enthusiasts worldwide.
          </p>

          <h2 className="text-black">Why Choose Filmzi?</h2>
          <ul className="text-gray-700">
            <li>
              <strong>Direct Downloads:</strong> No redirects, no waiting time, just direct download links
            </li>
            <li>
              <strong>Multiple Formats:</strong> Available in 480p, 720p, and 1080p HD quality
            </li>
            <li>
              <strong>Latest Movies:</strong> Regular updates with the newest releases
            </li>
            <li>
              <strong>Mobile Friendly:</strong> Optimized for all devices and screen sizes
            </li>
            <li>
              <strong>No Registration:</strong> Download movies without creating an account
            </li>
          </ul>

          <h2 className="text-black">Disclaimer</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">
              <strong>Important Notice:</strong> Filmzi does not host any files on our servers. All movie links are
              collected from various sources on the internet. We are not responsible for the accuracy, compliance,
              copyright, legality, decency, or any other aspect of the content of linked sites.
            </p>
          </div>

          <h2 className="text-black">Contact & Support</h2>
          <p className="text-gray-700">
            For any queries, suggestions, or support, feel free to reach out to us on Telegram:
            <a
              href="https://t.me/filmzi2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500"
            >
              @filmzi
            </a>
          </p>

          <h2 className="text-black">Super Features Coming Soon</h2>
          <ul className="text-gray-700">
            <li>🎬 Movie Trailers & Reviews</li>
            <li>📱 Mobile App for iOS & Android</li>
            <li>🔔 Push Notifications for New Releases</li>
            <li>⭐ User Ratings & Reviews</li>
            <li>📺 TV Series & Web Shows</li>
            <li>🎵 Movie Soundtracks</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
