export function getYouTubeEmbedUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const isShort = parsed.hostname.includes("youtu.be");
    const isYouTube = parsed.hostname.includes("youtube.com");
    if (!isShort && !isYouTube) return null;

    const videoId = isShort ? parsed.pathname.slice(1) : parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
    if (!videoId) return null;

    const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    if (parsed.searchParams.get("v360") === "1" || parsed.searchParams.get("360") === "1") {
      embed.searchParams.set("enablejsapi", "0");
    }
    embed.searchParams.set("rel", "0");
    return embed.toString();
  } catch {
    return null;
  }
}

