import React from "react"

const YouTubeVideo = ({ videoId, title }) => (
  <div>
    <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden", borderRadius: "0.75rem" }}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
    <p className="font-text text-sm mt-4">
      <a className="underline" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer noopener">
        Watch on YouTube
      </a>
    </p>
  </div>
)

export default YouTubeVideo
