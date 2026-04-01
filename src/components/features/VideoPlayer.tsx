type Props = {
  url?: string;
  title?: string;
  onEnded?: () => void;
  onDurationDetected?: (duration: string) => void;
};

const isYouTube = (url: string) => /youtu\.be|youtube\.com/.test(url);
const isVimeo = (url: string) => /vimeo\.com/.test(url);

const getVimeoEmbedUrl = (url: string) => {
  // Caso o usuário cole o HTML inteiro e a extração falhe no admin, tentamos extrair aqui também
  if (url.includes('<iframe')) {
    const vimeoMatch = url.match(/https?:\/\/player\.vimeo\.com\/video\/[^\s"'<>]+/i);
    if (vimeoMatch) url = vimeoMatch[0].replace(/&amp;/g, '&');
  }

  if (url.includes('player.vimeo.com/video/')) {
    // Se já for player.vimeo.com e não tiver o parâmetro h, mas a URL original tiver hash no path
    if (!url.includes('?h=') && !url.includes('&h=')) {
      const pathParts = url.split('/');
      // Formato player.vimeo.com/video/ID/HASH
      if (pathParts.length > 5) {
        const videoId = pathParts[4];
        const hash = pathParts[5].split('?')[0];
        return `https://player.vimeo.com/video/${videoId}?h=${hash}`;
      }
    }
    return url;
  }

  // Regex para capturar ID e opcional Hash (parâmetro h ou sub-path)
  // Lida com: vimeo.com/123456789/abcdef0123 OU vimeo.com/123456789 OU vimeo.com/video/123456789
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/;
  const match = url.match(regExp);

  if (match) {
    const videoId = match[1];
    const hash = match[2];
    return `https://player.vimeo.com/video/${videoId}${hash ? `?h=${hash}` : ''}`;
  }

  return url;
};

import { useEffect, useRef, useState } from "react";

export const VideoPlayer = ({ url, title, onEnded, onDurationDetected }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Detecta se o navegador suporta Fullscreen API (ex: false no iPhone)
    const canFullscreen = !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
    setSupportsFullscreen(canFullscreen);
  }, []);

  useEffect(() => {
    if (!url || !isVimeo(url) || !onDurationDetected) return;

    const handleMessage = (event: MessageEvent) => {
      // Basic security check: ensure message is from Vimeo
      if (!event.origin.includes("vimeo.com")) return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        // When player is ready, we can request duration and set listeners
        if (data.event === "ready" && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "getDuration" }), "*");
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "play" }), "*");
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "pause" }), "*");
        }

        // Receive duration from Vimeo
        if (data.method === "getDuration" || data.event === "durationchange") {
          const totalSeconds = Math.floor(data.value || 0);
          if (totalSeconds > 0) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            onDurationDetected(durationStr);
          }
        }
        // Handle play/pause events from Vimeo directly
        if (data.event === "play") {
          setIsPlaying(true);
        }
        if (data.event === "pause") {
          setIsPlaying(false);
        }

      } catch (e) {
        // Ignore parsing errors from other messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [url, onDurationDetected]);
  if (!url) {
    return (
      <div className="aspect-video bg-card rounded-xl overflow-hidden border border-border flex items-center justify-center">
        <div className="text-center space-y-2 p-6">
          <p className="text-lg font-medium text-foreground">📹 Vídeo não disponível</p>
          <p className="text-sm text-muted-foreground">Esta aula ainda não possui um vídeo cadastrado.</p>
        </div>
      </div>
    );
  }

  if (isYouTube(url)) {
    const embed = url
      .replace("watch?v=", "embed/")
      .replace("youtu.be/", "www.youtube.com/embed/");
    return (
      <div
        className="aspect-video rounded-xl overflow-hidden border border-border relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          title={title || "Vídeo"}
          src={`${embed}${embed.includes("?") ? "&" : "?"}modestbranding=1&rel=0`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {/* Overlay transparente para bloquear botão direito no centro do vídeo */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="w-full h-[calc(100%-60px)] pointer-events-auto bg-transparent" />
        </div>
      </div>
    );
  }

  if (isVimeo(url)) {
    return (
      <div
        className="aspect-video rounded-xl overflow-hidden border border-border relative group"
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          ref={iframeRef}
          title={title || "Vídeo"}
          src={`${getVimeoEmbedUrl(url)}${url.includes("?") ? "&" : "?"}api=1&dnt=1&title=0&byline=0&portrait=0&badge=0`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        
        {/* Camada superior em todo o vídeo quando PAUSADO para interceptar o clique com gesto local */}
        {!isPlaying && supportsFullscreen && (
          <div
            className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            onClick={(e) => {
              // 1. OBRIGATÓRIO: Chamar fullscreen sincronamente dentro deste evento do usuário
              const container = iframeRef.current || e.currentTarget.closest('.aspect-video');
              if (container) {
                try {
                  if ((container as any).requestFullscreen) {
                    (container as any).requestFullscreen().catch(() => {});
                  } else if ((container as any).webkitRequestFullscreen) {
                    (container as any).webkitRequestFullscreen();
                  }
                } catch (err) {}
              }

              // 2. Comanda o play para o Vimeo
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage('{"method":"play"}', "*");
              }
              
              // 3. Otimista update visual
              setIsPlaying(true);
            }}
          />
        )}

        {/* Camada parcial permanente apenas contra right-click, não bloqueia controles nativos e mantém isPlaying saudável */}
        {isPlaying && (
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="w-full h-[calc(100%-60px)] pointer-events-auto bg-transparent" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="aspect-video rounded-xl overflow-hidden border border-border"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full"
        src={url}
        title={title || "Vídeo"}
        onEnded={onEnded}
      />
    </div>
  );
};
