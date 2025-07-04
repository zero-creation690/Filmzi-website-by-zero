"use client"

import { Download, Play } from "lucide-react"
import Link from "next/link"

interface DownloadLinksProps {
  video_link_720p: string
  video_link_1080p: string
  title: string
  movieId: number
}

export default function DownloadLinks({
  video_link_720p,
  video_link_1080p,
  title,
  movieId,
}: DownloadLinksProps) {
  const downloadLinks = [
    { quality: "720p", url: video_link_720p, size: "~700MB" },
    { quality: "1080p", url: video_link_1080p, size: "~1.5GB" },
  ]

  const handleDownload = (url: string, quality: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Download Options</h3>

      <div className="grid gap-3">
        {downloadLinks.map((link) => (
          <div
            key={link.quality}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-black">{link.quality} Quality</p>
                <p className="text-sm text-gray-500">{link.size}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleDownload(link.url, link.quality)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Watch Online Button */}
      <div className="mt-6">
        <Link
          href={`/watch/${movieId}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Play className="h-5 w-5" />
          <span>Watch Online</span>
        </Link>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> All downloads are direct links. No ads, no redirects, no waiting time.
        </p>
      </div>
    </div>
  )
}
