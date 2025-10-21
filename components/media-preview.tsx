"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { getMediaType } from "@/lib/utils/media";

interface MediaPreviewProps {
  src: string;
  alt?: string;
  className?: string;
  videoClassName?: string;
  imageClassName?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: () => void;
}

export function MediaPreview({
  src,
  alt = "Media",
  className = "",
  videoClassName = "",
  imageClassName = "",
  showControls = true,
  autoPlay = false,
  muted = false, // Changed default to false to enable sound
  loop = false,
  onError,
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  const mediaType = getMediaType(src);

  const handlePlayPause = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoError = () => {
    console.error("Video failed to load:", src);
    onError?.();
  };

  const handleImageError = () => {
    console.error("Image failed to load:", src);
    onError?.();
  };

  if (mediaType === "video") {
    return (
      <div className={`relative group ${className}`}>
        <video
          ref={setVideoElement}
          src={src}
          className={`w-full h-full object-cover ${videoClassName}`}
          controls // Added native browser controls for volume, fullscreen, etc.
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          controlsList="nodownload" // Disable download option but keep other controls
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {/* Custom play/pause overlay - only shows when controls are hidden or on hover */}
        {showControls && !isPlaying && (
          <button
            type="button"
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
            aria-label="Play video"
          >
            <div className="bg-white/90 rounded-full p-4 shadow-lg hover:bg-white transition-colors">
              <Play className="h-8 w-8 text-gray-900 ml-1" />
            </div>
          </button>
        )}
        {/* Always visible small play button indicator when paused */}
        {!isPlaying && (
          <div className="absolute bottom-14 right-2 bg-black/50 rounded-full p-2 pointer-events-none">
            <Play className="h-4 w-4 text-white" fill="white" />
          </div>
        )}
      </div>
    );
  }

  // Default to image
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${imageClassName} ${className}`}
      onError={(e) => {
        e.currentTarget.src = "/placeholder.svg";
        handleImageError();
      }}
    />
  );
}

interface MediaThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Compact media thumbnail with video indicator
 */
export function MediaThumbnail({
  src,
  alt = "Media",
  className = "",
  onClick,
}: MediaThumbnailProps) {
  const mediaType = getMediaType(src);
  const isVideo = mediaType === "video";

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video
            src={src}
            className="w-full h-full object-cover"
            preload="metadata"
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="h-6 w-6 text-gray-900 ml-0.5" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
      )}
    </div>
  );
}
