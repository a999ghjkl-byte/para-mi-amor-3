const CORRECT_PIN = "2908";

const display = document.getElementById("password-display");
const errorEl = document.getElementById("error");
const lockScreen = document.getElementById("lock-screen");
const unlocked = document.getElementById("unlocked");
const coverImage = document.getElementById("cover-image");
const credits = document.getElementById("credits");
const creditsTrack = document.getElementById("credits-track");
const replayBtn = document.getElementById("replay");
const bgMusic = document.getElementById("bg-music");
const musicPlayer = document.getElementById("music-player");
const musicToggle = document.getElementById("music-toggle");
const musicIcon = document.getElementById("music-icon");
const volumeSlider = document.getElementById("volume-slider");
const volumeIcon = document.getElementById("volume-icon");

let pin = "";
let creditsStarted = false;
let musicPlaying = false;
let previousVolume = 0.7;

if (bgMusic && volumeSlider) {
  bgMusic.volume = parseFloat(volumeSlider.value) || 0.7;
}

function updateDisplay() {
  display.textContent = "♥".repeat(pin.length);
}

function shakeKeys() {
  errorEl.classList.add("visible");
  pin = "";
  updateDisplay();
}

function startCredits() {
  if (!creditsTrack || !credits) return;
  replayBtn.hidden = true;
  creditsTrack.classList.remove("is-playing");
  creditsTrack.style.removeProperty("animation");
  creditsTrack.style.removeProperty("animation-duration");
  void creditsTrack.offsetWidth;

  const distance = creditsTrack.scrollHeight + credits.clientHeight;
  const seconds = Math.max(110, distance / 34);
  creditsTrack.style.animationDuration = `${seconds}s`;
  creditsTrack.classList.add("is-playing");
}

function playMusic() {
  if (!bgMusic) return;
  bgMusic.play().then(() => {
    musicPlaying = true;
    musicToggle.classList.add("is-playing");
    musicToggle.classList.remove("is-muted");
    musicIcon.textContent = "♫";
  }).catch(() => {
    // El navegador bloquea autoplay; el usuario puede dar click al botón
    musicPlaying = false;
    musicToggle.classList.remove("is-playing");
  });
}

function toggleMusic() {
  if (!bgMusic) return;
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicToggle.classList.remove("is-playing");
    musicToggle.classList.add("is-muted");
    musicIcon.textContent = "♪";
  } else {
    playMusic();
  }
}

function unlock() {
  errorEl.classList.remove("visible");
  lockScreen.classList.add("is-hidden");
  lockScreen.hidden = true;
  lockScreen.setAttribute("aria-hidden", "true");
  unlocked.hidden = false;
  unlocked.removeAttribute("aria-hidden");
  unlocked.classList.add("is-open");
  document.body.classList.add("is-unlocked");

  // Mostrar widget de música y reproducir
  if (musicPlayer) {
    musicPlayer.hidden = false;
  } else if (musicToggle) {
    musicToggle.hidden = false;
  }
  playMusic();

  if (!creditsStarted) {
    creditsStarted = true;
    requestAnimationFrame(() => requestAnimationFrame(startCredits));
  }
}

if (creditsTrack) {
  creditsTrack.addEventListener("animationend", (event) => {
    if (event.animationName === "rise") replayBtn.hidden = false;
  });
}

if (replayBtn) {
  replayBtn.addEventListener("click", startCredits);
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleMusic);
}

// Control del regulador de volumen
if (volumeSlider && bgMusic) {
  volumeSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    bgMusic.volume = val;
    if (val === 0) {
      if (volumeIcon) volumeIcon.textContent = "🔇";
    } else if (val < 0.4) {
      if (volumeIcon) volumeIcon.textContent = "🔉";
    } else {
      if (volumeIcon) volumeIcon.textContent = "🔊";
    }
  });
}

// Click en el icono de volumen para mutear/desmutear
if (volumeIcon && bgMusic && volumeSlider) {
  volumeIcon.addEventListener("click", () => {
    if (bgMusic.volume > 0) {
      previousVolume = bgMusic.volume;
      bgMusic.volume = 0;
      volumeSlider.value = 0;
      volumeIcon.textContent = "🔇";
    } else {
      const restored = previousVolume || 0.7;
      bgMusic.volume = restored;
      volumeSlider.value = restored;
      volumeIcon.textContent = restored < 0.4 ? "🔉" : "🔊";
    }
  });
}

function checkPassword() {
  if (!pin.length) return;
  if (pin === CORRECT_PIN) {
    unlock();
    return;
  }
  shakeKeys();
}

function addDigit(digit) {
  if (pin.length >= 8) return;
  pin += digit;
  errorEl.classList.remove("visible");
  updateDisplay();
  if (pin.length === CORRECT_PIN.length) {
    checkPassword();
  }
}

function deleteDigit() {
  pin = pin.slice(0, -1);
  updateDisplay();
}

document.querySelector(".keyboard").addEventListener("click", (event) => {
  const button = event.target.closest(".key");
  if (!button) return;

  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 100);

  if (button.dataset.digit != null) {
    addDigit(button.dataset.digit);
  } else if (button.dataset.action === "delete") {
    deleteDigit();
  } else if (button.dataset.action === "enter") {
    checkPassword();
  }
});

document.addEventListener("keydown", (event) => {
  if (lockScreen.classList.contains("is-hidden")) return;
  if (/^[0-9]$/.test(event.key)) {
    addDigit(event.key);
  } else if (event.key === "Backspace") {
    deleteDigit();
  } else if (event.key === "Enter") {
    checkPassword();
  }
});

// ===== Manejo de imagen de portada =====
const imageContainer = document.getElementById("image-container");
if (coverImage && imageContainer) {
  const markMissing = () => imageContainer.classList.add("no-photo");
  const markReady = () => imageContainer.classList.remove("no-photo");

  coverImage.addEventListener("error", markMissing);
  coverImage.addEventListener("load", markReady);

  if (coverImage.complete) {
    if (coverImage.naturalWidth === 0) markMissing();
    else markReady();
  }
}

// ===== Manejo de fotos intercaladas en créditos =====
document.querySelectorAll(".credits-photo").forEach((frame) => {
  const img = frame.querySelector(".credits-photo-img");
  if (!img) return;

  const markMissing = () => frame.classList.add("no-photo");
  const markReady = () => frame.classList.remove("no-photo");

  img.addEventListener("error", markMissing);
  img.addEventListener("load", markReady);

  if (img.complete) {
    if (img.naturalWidth === 0) markMissing();
    else markReady();
  }
});
