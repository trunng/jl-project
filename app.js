/**
 * MAIN APP LOGIC FOR "GỬI TRÍ LỢI"
 * Storytelling Slides, Interactive Widgets, Logging, Photos & Ambient FX
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE & CONSTANTS
  // ==========================================
  let currentSlide = 0;
  const totalSlides = document.querySelectorAll('.story-slide').length;
  const STORAGE_KEY_LOGS = 'jl_interactions_log';
  const STORAGE_KEY_PHOTOS = 'jl_saved_photos';
  const STORAGE_KEY_HUGS = 'jl_hug_count';

  // DOM Elements
  const slides = document.querySelectorAll('.story-slide');
  const progressBar = document.getElementById('story-progress-bar');
  const btnPrev = document.getElementById('btn-prev-slide');
  const btnNext = document.getElementById('btn-next-slide');
  const dotsContainer = document.getElementById('slide-dots-container');
  const btnToggleMusic = document.getElementById('btn-toggle-music');
  const musicStatusText = document.getElementById('music-status-text');
  const musicIcon = document.getElementById('music-icon');
  const musicModal = document.getElementById('music-modal');
  const btnOpenMusicModal = document.getElementById('btn-music-modal');
  const btnCloseMusicModal = document.getElementById('btn-close-music-modal');
  const btnSaveMusicSettings = document.getElementById('btn-save-music-settings');
  const volumeSlider = document.getElementById('volume-slider');
  const heartBurstContainer = document.getElementById('heart-burst-container');

  // ==========================================
  // INITIALIZE DOTS & PROGRESS
  // ==========================================
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('div');
    dot.className = `slide-dot ${i === 0 ? 'active' : ''}`;
    dot.dataset.targetSlide = i;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }

  function updateNavigationUI() {
    slides.forEach((slide, idx) => {
      if (idx === currentSlide) {
        slide.classList.add('active');
        slide.scrollTop = 0;
      } else {
        slide.classList.remove('active');
      }
    });

    const dots = dotsContainer.querySelectorAll('.slide-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });

    // Update Progress Bar
    const progressPercent = (currentSlide / (totalSlides - 1)) * 100;
    progressBar.style.width = `${progressPercent}%`;

    // Button states
    btnPrev.disabled = (currentSlide === 0);
    btnNext.disabled = (currentSlide === totalSlides - 1);

    if (currentSlide === totalSlides - 1) {
      btnNext.classList.remove('primary-next');
      btnNext.innerHTML = '<span class="nav-text">Hết</span>';
    } else {
      btnNext.classList.add('primary-next');
      btnNext.innerHTML = '<span class="nav-text">Tiếp theo</span><span class="arrow">›</span>';
    }
  }

  function goToSlide(targetIndex) {
    if (targetIndex < 0 || targetIndex >= totalSlides) return;
    currentSlide = targetIndex;
    updateNavigationUI();
    logInteraction(`Chuyển đến Slide ${currentSlide}: ${getSlideTitle(currentSlide)}`);
  }

  function getSlideTitle(idx) {
    const slide = document.getElementById(`slide-${idx}`);
    const heading = slide ? slide.querySelector('.slide-heading, .main-title') : null;
    return heading ? heading.innerText.trim() : `Slide ${idx}`;
  }

  btnPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
  btnNext.addEventListener('click', () => goToSlide(currentSlide + 1));

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown'].includes(e.key)) {
      goToSlide(currentSlide + 1);
    } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
      goToSlide(currentSlide - 1);
    }
  });

  // Touch Swipe for Mobile
  let touchStartX = 0;
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Horizontal swipe threshold
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX < 0) {
        goToSlide(currentSlide + 1); // Swipe left -> Next
      } else {
        goToSlide(currentSlide - 1); // Swipe right -> Prev
      }
    }
  }, { passive: true });

  // ==========================================
  // LOGGING SYSTEM ("GHI NHẬN LẠI GIÚP TÔI")
  // ==========================================
  function logInteraction(actionText, details = '') {
    const existingLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
    const now = new Date();
    const timeFormatted = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    
    existingLogs.unshift({
      timestamp: timeFormatted,
      action: actionText,
      details: details
    });

    // Keep up to 60 logs
    if (existingLogs.length > 60) existingLogs.pop();
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(existingLogs));

    renderLogList();
  }

  function renderLogList() {
    const logList = document.getElementById('log-list');
    if (!logList) return;

    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '[]');
    if (logs.length === 0) {
      logList.innerHTML = '<p class="empty-log">Chưa có tương tác nào được ghi lại.</p>';
      return;
    }

    logList.innerHTML = logs.map(item => `
      <div class="log-item">
        <div class="log-time">${item.timestamp}</div>
        <div class="log-text"><strong>${escapeHtml(item.action)}</strong> ${item.details ? `— <em>"${escapeHtml(item.details)}"</em>` : ''}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Accordion toggle for logs
  const btnViewLogs = document.getElementById('btn-view-logs');
  const logContentBox = document.getElementById('log-content-box');
  const btnClearLogs = document.getElementById('btn-clear-logs');

  if (btnViewLogs && logContentBox) {
    btnViewLogs.addEventListener('click', () => {
      logContentBox.classList.toggle('hidden');
      renderLogList();
    });
  }

  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_LOGS);
      renderLogList();
    });
  }

  // ==========================================
  // AMBIENT BACKGROUND CANVAS (STARS & DUST)
  // ==========================================
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const starCount = 80;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.015 + 0.005,
      color: Math.random() > 0.4 ? '#fbcfe8' : '#fef08a'
    });
  }

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0) {
        star.speed = -star.speed;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, star.alpha));
      ctx.shadowBlur = 8;
      ctx.shadowColor = star.color;
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animateStars);
  }
  animateStars();

  // Floating Heart Particle on Click
  document.addEventListener('click', (e) => {
    // Avoid triggering if clicking inputs or sliders
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    createFloatingHeart(e.clientX, e.clientY);
  });

  function createFloatingHeart(x, y) {
    if (!heartBurstContainer) return;
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    const hearts = ['❤️', '💖', '✨', '🌸', '💫'];
    heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 80}px`);
    heartBurstContainer.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1600);
  }

  // ==========================================
  // AUDIO & MUSIC CONTROLS
  // ==========================================
  if (window.romanticAudio) {
    window.romanticAudio.onStateChange((isPlaying) => {
      btnToggleMusic.classList.toggle('playing', isPlaying);
      musicStatusText.innerText = isPlaying ? 'Đang phát' : 'Tạm dừng';
      musicIcon.innerText = isPlaying ? '🎵' : '🔇';
    });
  }

  btnToggleMusic.addEventListener('click', () => {
    if (window.romanticAudio) {
      window.romanticAudio.toggle();
      logInteraction('Bấm nút bật/tắt nhạc');
    }
  });

  btnOpenMusicModal.addEventListener('click', () => {
    musicModal.classList.remove('hidden');
  });

  btnCloseMusicModal.addEventListener('click', () => {
    musicModal.classList.add('hidden');
  });

  btnSaveMusicSettings.addEventListener('click', () => {
    musicModal.classList.add('hidden');
  });

  volumeSlider.addEventListener('input', (e) => {
    if (window.romanticAudio) {
      window.romanticAudio.setVolume(e.target.value);
    }
  });

  // Music Choice Radio
  const radioTracks = document.querySelectorAll('input[name="soundtrack-choice"]');
  const customMusicUploader = document.getElementById('custom-music-uploader');
  const musicFileInput = document.getElementById('music-file-input');
  const customMusicFilename = document.getElementById('custom-music-filename');

  radioTracks.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'custom-file') {
        customMusicUploader.classList.remove('hidden');
      } else {
        customMusicUploader.classList.add('hidden');
        if (window.romanticAudio) {
          window.romanticAudio.isUsingCustom = false;
          if (window.romanticAudio.isPlaying) {
            window.romanticAudio.startPianoLoop();
          }
        }
      }
    });
  });

  musicFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && window.romanticAudio) {
      customMusicFilename.innerText = `Đã chọn: ${file.name}`;
      window.romanticAudio.setCustomAudio(file);
      window.romanticAudio.play();
      logInteraction('Tải lên bài hát tùy chỉnh', file.name);
    }
  });

  // ==========================================
  // SLIDE 0: ENVELOPE GATE (START MUSIC & STORY)
  // ==========================================
  const gateEnvelope = document.getElementById('gate-envelope');
  if (gateEnvelope) {
    gateEnvelope.addEventListener('click', () => {
      // Auto-start romantic audio
      if (window.romanticAudio && !window.romanticAudio.isPlaying) {
        window.romanticAudio.play();
      }
      if (window.romanticAudio) {
        window.romanticAudio.playChime('bell');
      }
      logInteraction('Lợi đã chạm mở phong bì thư mở đầu 💌');
      goToSlide(1);
    });
  }

  // ==========================================
  // SLIDE 1: NOEL WIDGET
  // ==========================================
  const btnOpenNoelGift = document.getElementById('btn-open-noel-gift');
  const noelGiftReveal = document.getElementById('noel-gift-reveal');
  if (btnOpenNoelGift && noelGiftReveal) {
    btnOpenNoelGift.addEventListener('click', () => {
      noelGiftReveal.classList.remove('hidden');
      btnOpenNoelGift.innerText = '🎁 Chiếc hộp đã mở ra ký ức đẹp';
      if (window.romanticAudio) window.romanticAudio.playChime('heart');
      logInteraction('Mở hộp quà Noel (Chiếc vòng đôi & Lời hứa Santa)');
    });
  }

  // Mini reactions
  document.querySelectorAll('.mini-reaction-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const reaction = e.target.dataset.reaction || 'tim';
      e.target.style.background = 'rgba(244, 114, 182, 0.4)';
      e.target.innerText = '❤️ Cảm ơn anh đã nhớ...';
      if (window.romanticAudio) window.romanticAudio.playChime('heart');
      logInteraction('Nhấn nút phản hồi nhỏ', reaction);
    });
  });

  // ==========================================
  // SLIDE 2: SCOOTER WIDGET
  // ==========================================
  const btnDriveScooter = document.getElementById('btn-drive-scooter');
  const movingScooter = document.getElementById('moving-scooter');
  const roadSubtext = document.getElementById('road-subtext');
  let scooterPos = 10;

  if (btnDriveScooter && movingScooter) {
    btnDriveScooter.addEventListener('click', () => {
      scooterPos = scooterPos > 60 ? 10 : scooterPos + 25;
      movingScooter.style.left = `${scooterPos}%`;
      roadSubtext.innerText = '💨 Xe đang vi vu chở Jun dạo mát khắp Sài Gòn!';
      if (window.romanticAudio) window.romanticAudio.playChime('bell');
      logInteraction('Lái xe chở Jun đi dạo Sài Gòn');
    });
  }

  // ==========================================
  // SLIDE 3: LUCKY RED ENVELOPE WIDGET
  // ==========================================
  const btnOpenLucky = document.getElementById('btn-open-lucky');
  const luckyWishReveal = document.getElementById('lucky-wish-reveal');
  if (btnOpenLucky && luckyWishReveal) {
    btnOpenLucky.addEventListener('click', () => {
      luckyWishReveal.classList.remove('hidden');
      if (window.romanticAudio) window.romanticAudio.playChime('bell');
      logInteraction('Mở bao lì xì Tết của Lợi');
    });
  }

  // ==========================================
  // SLIDE 4: PRONOUN SWITCHER WIDGET
  // ==========================================
  const pronounSwitch = document.getElementById('pronoun-switch');
  const pronounMessage = document.getElementById('pronoun-message');
  if (pronounSwitch && pronounMessage) {
    pronounSwitch.addEventListener('change', (e) => {
      if (e.target.checked) {
        pronounMessage.innerText = '"Từ hôm nay 19/02/2024, gọi anh là anh nhé... còn em là bé người yêu của anh! 💕"';
        if (window.romanticAudio) window.romanticAudio.playChime('heart');
        logInteraction('Gạt công tắc xưng hô: Anh & Em');
      } else {
        pronounMessage.innerText = '"Hai đứa bạn đồng hành thuở ban đầu..."';
        logInteraction('Gạt công tắc xưng hô: Bạn bè');
      }
    });
  }

  // ==========================================
  // SLIDE 5: PETS CUDDLE WIDGET
  // ==========================================
  let joiCount = 0;
  let minCount = 0;
  const btnPetJoi = document.getElementById('btn-pet-joi');
  const btnPetMin = document.getElementById('btn-pet-min');
  const joiPetCount = document.getElementById('joi-pet-count');
  const minPetCount = document.getElementById('min-pet-count');
  const petSpeech = document.getElementById('pet-speech');

  if (btnPetJoi) {
    btnPetJoi.addEventListener('click', () => {
      joiCount++;
      joiPetCount.innerText = `Đã cưng: ${joiCount} lần`;
      petSpeech.classList.remove('hidden');
      petSpeech.innerText = '🐶 Bé Joi: "Gâu gâu! Ba Lợi với ba Jun đừng giận nhau nữa nha..."';
      if (window.romanticAudio) window.romanticAudio.playChime('purr');
      logInteraction('Xoa đầu bé Joi', `Lần thứ ${joiCount}`);
    });
  }

  if (btnPetMin) {
    btnPetMin.addEventListener('click', () => {
      minCount++;
      minPetCount.innerText = `Đã cưng: ${minCount} lần`;
      petSpeech.classList.remove('hidden');
      petSpeech.innerText = '🐱 Bé Min: "Meo meo... Con nhớ những ngày cả 4 đứa mình nằm ôm nhau ngủ lắm..."';
      if (window.romanticAudio) window.romanticAudio.playChime('purr');
      logInteraction('Gãi cằm bé Min', `Lần thứ ${minCount}`);
    });
  }

  // ==========================================
  // SLIDE 6: DAYS COUNTER & RAIN/SUN WIDGET
  // ==========================================
  const liveDaysCounter = document.getElementById('live-days-counter');
  if (liveDaysCounter) {
    // Exact official day 19/02/2024
    const startDate = new Date('2024-02-19T00:00:00');
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    liveDaysCounter.innerText = `${diffDays} ngày kể từ cột mốc 19/02/2024`;
  }

  const btnHoldUmbrella = document.getElementById('btn-hold-umbrella');
  const stormSkyBox = document.getElementById('storm-sky-box');
  const skyIcon = document.getElementById('sky-icon');
  const skyStatusText = document.getElementById('sky-status-text');

  if (btnHoldUmbrella && stormSkyBox) {
    btnHoldUmbrella.addEventListener('click', () => {
      skyIcon.innerText = '🌤️🌈✨';
      skyStatusText.innerText = 'Cơn mưa nào rồi cũng tạnh, sau bão giông là cầu vồng rực rỡ!';
      stormSkyBox.style.background = 'rgba(251, 191, 36, 0.2)';
      if (window.romanticAudio) window.romanticAudio.playChime('heart');
      logInteraction('Nhấn che ô qua bão giông');
    });
  }

  // ==========================================
  // SLIDE 7: SISTER MESSAGE WIDGET
  // ==========================================
  const btnReadSister = document.getElementById('btn-read-sister');
  const sisterCardReveal = document.getElementById('sister-card-reveal');
  if (btnReadSister && sisterCardReveal) {
    btnReadSister.addEventListener('click', () => {
      sisterCardReveal.classList.remove('hidden');
      logInteraction('Đọc lời nhắn từ Chị gái');
    });
  }

  // ==========================================
  // SLIDE 8: HONEST QUESTION POLL
  // ==========================================
  const pollOptions = document.querySelectorAll('.poll-btn');
  const pollFeedback = document.getElementById('poll-feedback');
  const feedbackText = pollFeedback ? pollFeedback.querySelector('.feedback-text') : null;

  pollOptions.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const choice = e.currentTarget.dataset.choice;
      const text = e.currentTarget.innerText.trim();

      pollOptions.forEach(b => b.style.borderColor = 'rgba(255, 255, 255, 0.12)');
      e.currentTarget.style.borderColor = 'var(--primary-rose)';

      pollFeedback.classList.remove('hidden');
      if (choice === 'roi-boi') {
        feedbackText.innerText = 'Jun biết anh đang có nhiều áp lực... Chỉ mong anh đừng vội vàng đưa ra quyết định để rồi sau này phải tiếc nuối.';
      } else if (choice === 'trong-vang') {
        feedbackText.innerText = 'Khoảng trống ấy không người mới nào bù đắp được nếu trong lòng anh vẫn còn bóng hình của những năm tháng cũ đâu anh...';
      } else {
        feedbackText.innerText = 'Nếu chưa biết mình muốn gì, xin anh hãy chậm lại một chút, đừng cố chạy trốn cảm xúc thật của mình.';
      }

      if (window.romanticAudio) window.romanticAudio.playChime('heart');
      logInteraction('Lợi trả lời câu hỏi nỗi lòng', text);
    });
  });

  // ==========================================
  // SLIDE 9: SLOW DOWN / BREATHE WIDGET
  // ==========================================
  const btnSlowDown = document.getElementById('btn-slow-down');
  const breatheContainer = document.getElementById('breathe-circle-container');
  const breatheText = document.getElementById('breathe-text');

  if (btnSlowDown && breatheContainer) {
    btnSlowDown.addEventListener('click', () => {
      breatheContainer.classList.remove('hidden');
      btnSlowDown.innerText = '🕊️ Đang chậm lại cùng nhau...';
      
      let isInhale = true;
      setInterval(() => {
        isInhale = !isInhale;
        if (breatheText) {
          breatheText.innerText = isInhale ? 'Hít vào...' : 'Thở ra...';
        }
      }, 4000);

      logInteraction('Bấm nút chậm lại 1 nhịp cùng Jun');
    });
  }

  // ==========================================
  // SLIDE 10: RESPONSE & MESSAGE PORTAL
  // ==========================================
  const loiReplyInput = document.getElementById('loi-reply-input');
  const btnSaveReply = document.getElementById('btn-save-reply');
  const btnOpenZalo = document.getElementById('btn-open-zalo');
  const replyStatusMessage = document.getElementById('reply-status-message');
  const feelingTags = document.querySelectorAll('.feeling-tag');

  feelingTags.forEach(tag => {
    tag.addEventListener('click', (e) => {
      const msg = e.currentTarget.dataset.msg;
      if (loiReplyInput) {
        loiReplyInput.value = msg;
        loiReplyInput.focus();
      }
    });
  });

  if (btnSaveReply) {
    btnSaveReply.addEventListener('click', () => {
      const message = (loiReplyInput.value || '').trim();
      if (!message) {
        alert('Lợi ơi, anh nhắn vài dòng suy nghĩ vào đây nhé ❤️');
        return;
      }

      logInteraction('Lợi đã gửi lời nhắn phản hồi', message);
      replyStatusMessage.classList.remove('hidden');
      replyStatusMessage.innerText = '✅ Lời nhắn của anh đã được lưu lại trong nhật ký của Jun!';
      if (window.romanticAudio) window.romanticAudio.playChime('bell');

      setTimeout(() => {
        replyStatusMessage.classList.add('hidden');
      }, 6000);
    });
  }

  if (btnOpenZalo) {
    btnOpenZalo.addEventListener('click', () => {
      const message = (loiReplyInput.value || 'Anh đã đọc hết những dòng tâm sự của Jun rồi...').trim();
      logInteraction('Bấm gửi qua Zalo / Tin nhắn', message);

      // Copy text to clipboard so Loi can paste anywhere easily
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
          alert(`Đã sao chép lời nhắn:\n"${message}"\n\nBạn có thể dán (Paste) để gửi ngay cho Trung qua Zalo hoặc Messenger nhé ❤️`);
        }).catch(() => {
          prompt('Sao chép lời nhắn này gửi cho Jun nhé:', message);
        });
      } else {
        prompt('Sao chép lời nhắn này gửi cho Jun nhé:', message);
      }
    });
  }

  // Virtual Hug Counter
  const btnVirtualHug = document.getElementById('btn-virtual-hug');
  const hugCounterEl = document.getElementById('hug-counter');
  let currentHugs = parseInt(localStorage.getItem(STORAGE_KEY_HUGS) || '0', 10);
  if (hugCounterEl) hugCounterEl.innerText = `Đã nhận được ${currentHugs} cái ôm ấm áp`;

  if (btnVirtualHug) {
    btnVirtualHug.addEventListener('click', () => {
      currentHugs++;
      localStorage.setItem(STORAGE_KEY_HUGS, currentHugs);
      hugCounterEl.innerText = `Đã nhận được ${currentHugs} cái ôm ấm áp`;
      if (window.romanticAudio) window.romanticAudio.playChime('heart');
      
      // Explosion of hearts
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          createFloatingHeart(
            window.innerWidth / 2 + (Math.random() - 0.5) * 120,
            window.innerHeight * 0.7 + (Math.random() - 0.5) * 60
          );
        }, i * 150);
      }

      logInteraction('Lợi gửi 1 cái ôm cho Jun 🫂', `Tổng cộng: ${currentHugs} cái ôm`);
    });
  }

  // ==========================================
  // CUSTOM PHOTO UPLOAD & LOCAL STORAGE
  // ==========================================
  const savedPhotos = JSON.parse(localStorage.getItem(STORAGE_KEY_PHOTOS) || '{}');
  
  // Render previously saved photos if any
  document.querySelectorAll('.memory-photo-box').forEach(box => {
    const photoId = box.dataset.photoId;
    if (savedPhotos[photoId]) {
      const placeholder = box.querySelector('.photo-placeholder-inner');
      const realImg = box.querySelector('.photo-real');
      if (realImg) {
        realImg.src = savedPhotos[photoId];
        realImg.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';
      }
    }
  });

  // Handle file inputs for photos
  document.querySelectorAll('.photo-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const targetId = e.target.dataset.target;
      if (!file || !targetId) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const box = document.querySelector(`.memory-photo-box[data-photo-id="${targetId}"]`);
        if (box) {
          const placeholder = box.querySelector('.photo-placeholder-inner');
          const realImg = box.querySelector('.photo-real');
          if (realImg) {
            realImg.src = base64;
            realImg.classList.remove('hidden');
            if (placeholder) placeholder.style.display = 'none';
          }
        }

        // Save to LocalStorage
        try {
          savedPhotos[targetId] = base64;
          localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(savedPhotos));
          logInteraction(`Đã thêm ảnh kỷ niệm cho mục: ${targetId}`);
        } catch (err) {
          console.warn('Image might exceed localStorage quota:', err);
        }
      };
      reader.readAsDataURL(file);
    });
  });

  // Initial Log render
  renderLogList();
  updateNavigationUI();
});
