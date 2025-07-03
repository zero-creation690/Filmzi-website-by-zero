import { Button } from "@/components/ui/button"
import { Download, Play } from "lucide-react"
import Link from "next/link"

interface DownloadLinksProps {
  movieId: string
  video480p?: string
  video720p?: string
  video1080p?: string
}

export default function DownloadLinks({ movieId, video480p, video720p, video1080p }: DownloadLinksProps) {
  return (
    <div className="space-y-4">
      {/* Watch Online Button */}
      <Link href={`/watch/${movieId}`}>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
          <Play className="h-5 w-5" />
          <span>Watch Online</span>
        </Button>
      </Link>

      {/* Download Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {video480p && (
          <a
            href={video480p}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>480p</span>
          </a>
        )}
        {video720p && (
          <a
            href={video720p}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>720p</span>
          </a>
        )}
        {video1080p && (
          <a
            href={video1080p}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>1080p</span>
          </a>
        )}
      </div>
    </div>
  )
}
