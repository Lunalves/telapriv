import { useRef, useState } from 'react';

export default function LateralVideos() {
  const videoRefs = useRef({});
  const [playingVideos, setPlayingVideos] = useState({});
  const [loadedVideos, setLoadedVideos] = useState({});
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  
  const videos = [
    { src: 'https://i.imgur.com/0GPp7R8.mp4', poster: 'https://i.imgur.com/0GPp7R8.jpg', index: 0 },
    { src: 'https://i.imgur.com/l90y6Uv.mp4', poster: 'https://i.imgur.com/l90y6Uv.jpg', index: 1 },
    { src: 'https://i.imgur.com/Bt8w9Kw.mp4', poster: 'https://i.imgur.com/Bt8w9Kw.jpg', index: 2 },
    { src: 'https://i.imgur.com/aNi7xyI.mp4', poster: 'https://i.imgur.com/aNi7xyI.jpg', index: 3 },
    { src: 'https://i.imgur.com/0Dz3nE3.mp4', poster: 'https://i.imgur.com/0Dz3nE3.jpg', index: 4 },
    { src: 'https://i.imgur.com/Sak1bbf.mp4', poster: 'https://i.imgur.com/Sak1bbf.jpg', index: 5 },
    { src: 'https://i.imgur.com/QSSIxjT.mp4', poster: 'https://i.imgur.com/QSSIxjT.jpg', index: 6 },
    { src: 'https://i.imgur.com/LB8CtWf.mp4', poster: 'https://i.imgur.com/LB8CtWf.jpg', index: 7 },
    { src: 'https://i.imgur.com/j5CM79w.mp4', poster: 'https://i.imgur.com/j5CM79w.jpg', index: 8 }
  ];

  const handleMouseEnter = (index) => {
    const video = videoRefs.current[`video-${index}`];
    if (video && !video.dataset.keepPlaying) {
      if (!loadedVideos[index] && video.readyState === 0) {
        video.load();
        setLoadedVideos(prev => ({ ...prev, [index]: true }));
      }
      
      if (video.paused && !video.dataset.isPlaying) {
        video.dataset.isPlaying = 'true';
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlayingVideos(prev => ({ ...prev, [index]: true }));
              video.dataset.isPlaying = 'false';
            })
            .catch(err => {
              if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                console.log('Erro ao reproduzir vídeo:', err);
              }
              setPlayingVideos(prev => ({ ...prev, [index]: false }));
              video.dataset.isPlaying = 'false';
            });
        }
      }
    }
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[`video-${index}`];
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Não pausar se o vídeo está sendo reproduzido por clique (keepPlaying)
    if (!isMobile && video && !video.paused && !video.dataset.keepPlaying && video.dataset.isPlaying !== 'true' && currentPlayingIndex !== index) {
      video.dataset.isPlaying = 'false';
      const pausePromise = video.pause();
      if (pausePromise && typeof pausePromise.catch === 'function') {
        pausePromise.catch(() => {});
      }
      video.currentTime = 0;
      setPlayingVideos(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleClick = (index) => {
    const video = videoRefs.current[`video-${index}`];
    
    if (video) {
      // Se o vídeo clicado já está reproduzindo, pausar
      if (!video.paused && currentPlayingIndex === index) {
        video.dataset.keepPlaying = 'false';
        video.dataset.isPlaying = 'false';
        const pausePromise = video.pause();
        if (pausePromise && typeof pausePromise.catch === 'function') {
          pausePromise.catch(() => {});
        }
        video.currentTime = 0;
        setPlayingVideos(prev => ({ ...prev, [index]: false }));
        setCurrentPlayingIndex(null);
        return;
      }
      
      // Pausar todos os outros vídeos primeiro
      videos.forEach((item) => {
        if (item.index !== index) {
          const otherVideo = videoRefs.current[`video-${item.index}`];
          if (otherVideo && !otherVideo.paused) {
            otherVideo.dataset.keepPlaying = 'false';
            otherVideo.dataset.isPlaying = 'false';
            const pausePromise = otherVideo.pause();
            if (pausePromise && typeof pausePromise.catch === 'function') {
              pausePromise.catch(() => {});
            }
            otherVideo.currentTime = 0;
            setPlayingVideos(prev => ({ ...prev, [item.index]: false }));
          }
        }
      });
      
      // Reproduzir o vídeo clicado
      if (video.paused) {
        if (!loadedVideos[index] && video.readyState === 0) {
          video.load();
          setLoadedVideos(prev => ({ ...prev, [index]: true }));
        }
        
        setTimeout(() => {
          if (video && video.paused && !video.dataset.isPlaying) {
            video.dataset.keepPlaying = 'true';
            video.dataset.isPlaying = 'true';
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setPlayingVideos(prev => ({ ...prev, [index]: true }));
                  setCurrentPlayingIndex(index);
                  video.dataset.isPlaying = 'false';
                })
                .catch(err => {
                  if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                    console.log('Erro ao reproduzir vídeo:', err);
                  }
                  setPlayingVideos(prev => ({ ...prev, [index]: false }));
                  setCurrentPlayingIndex(null);
                  video.dataset.keepPlaying = 'false';
                  video.dataset.isPlaying = 'false';
                });
            }
          }
        }, 100);
      }
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {videos.map((item) => (
        <div 
          key={item.index}
          className="relative rounded-2xl overflow-hidden aspect-square media-item"
          onMouseEnter={() => handleMouseEnter(item.index)}
          onMouseLeave={() => handleMouseLeave(item.index)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick(item.index);
          }}
        >
          {/* Thumbnail/Preview */}
          <img 
            src={item.poster} 
            alt={`Preview ${item.index + 1}`}
            className={`w-full h-full object-cover rounded-lg media-blur transition-all duration-300 ${
              playingVideos[item.index] ? 'opacity-0 absolute' : 'opacity-100'
            }`}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Vídeo */}
          <video 
            ref={(el) => {
              if (el) {
                videoRefs.current[`video-${item.index}`] = el;
              }
            }}
            className={`w-full h-full object-cover rounded-lg transition-all duration-300 ${
              playingVideos[item.index] 
                ? 'opacity-100' 
                : 'opacity-0 absolute top-0 left-0'
            } ${playingVideos[item.index] ? 'blur-0' : 'blur-5'}`}
            muted 
            loop
            playsInline
            preload="none"
            poster={item.poster}
          >
            <source src={item.src} type="video/mp4" />
            Seu navegador não suporta vídeos HTML5.
          </video>
          {/* Overlay */}
          <div 
            className="absolute inset-0 media-overlay rounded-lg transition-opacity duration-300 pointer-events-none" 
            style={{ 
              opacity: playingVideos[item.index] ? 0.2 : 0.5 
            }}
          ></div>
          {/* Ícone de cadeado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className={`w-12 h-12 transition-opacity duration-300 ${
              playingVideos[item.index] ? 'opacity-50' : 'opacity-70'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

