# OpenReel Video

> **The open source CapCut alternative. Professional video editing in your browser. No uploads. No installs. 100% open source.**

OpenReel Video is a fully-featured browser-based video editor that runs entirely client-side. Built with React, TypeScript, WebCodecs, and WebGPU for professional-grade video editing without the need for expensive software or cloud processing.

**[Try it Live](https://openreel.video)** | **[Documentation](CONTRIBUTING.md)** | **[Discussions](https://github.com/Augani/openreel-video/discussions)** | **[Twitter](https://x.com/python_xi)**

![OpenReel Editor](https://img.shields.io/badge/Lines%20of%20Code-130k+-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Beta-orange) ![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen) [![Sponsor Augani](https://img.shields.io/github/sponsors/Augani?logo=githubsponsors&label=Sponsor&color=EA4AAA)](https://github.com/sponsors/Augani)

---

## Why OpenReel?

- **100% Client-Side** - Your videos never leave your device. No uploads, no cloud processing, complete privacy.
- **No Installation** - Works in Chrome/Edge. Just open and start editing.
- **Professional Features** - Multi-track timeline, keyframe animations, color grading, audio effects, and more.
- **GPU Accelerated** - WebGPU and WebCodecs for smooth 4K editing and fast exports.
- **Free Forever** - MIT licensed, no subscriptions, no watermarks.

---

## Features

### Video Editing
- **Multi-track timeline** - Unlimited video, audio, image, text, and graphics tracks
- **Real-time preview** - Smooth playback with GPU acceleration
- **Precision editing** - Frame-accurate scrubbing, cut, trim, split, ripple delete
- **Transitions** - Crossfade, dip to black/white, wipe, slide effects
- **Video effects** - Brightness, contrast, saturation, blur, sharpen, glow, vignette, chroma key
- **Blend modes** - Multiply, screen, overlay, add, subtract, and more
- **Speed control** - 0.25x to 4x with audio pitch preservation
- **Crop & transform** - Position, scale, rotation with 3D perspective

### Graphics & Text
- **Professional text editor** - Rich styling, shadows, outlines, gradients
- **20+ text animations** - Typewriter, fade, slide, bounce, pop, elastic, glitch
- **Karaoke-style subtitles** - Word-by-word highlighting synced to audio
- **Shape tools** - Rectangle, circle, arrow, polygon, star with fill/stroke
- **SVG support** - Import SVGs with color tinting and animations
- **Stickers & emoji** - Built-in library
- **Background generator** - Solid colors, gradients, mesh gradients, patterns
- **Keyframe animations** - Animate any property over time with 20+ easing curves

### Audio
- **Multi-track mixing** - Unlimited audio tracks with real-time mixing
- **Waveform visualization** - Visual audio editing
- **Audio effects** - EQ, compressor, reverb, delay, chorus, flanger, distortion
- **Volume & panning** - Per-clip controls with fade in/out
- **Beat detection** - Auto-generate markers synced to music
- **Audio ducking** - Auto-reduce music when dialog plays
- **Noise reduction** - 3-pass noise removal (tonal, broadband, rumble)

### Color Grading
- **Color wheels** - Lift, gamma, gain controls
- **HSL adjustments** - Hue, saturation, lightness fine-tuning
- **Curves editor** - RGB and individual channel curves
- **LUT support** - Import and apply 3D LUTs
- **Built-in presets** - One-click color grading

### Export
- **MP4 (H.264/H.265)** - Universal compatibility
- **WebM (VP8/VP9/AV1)** - Web-optimized format
- **ProRes** - Professional intermediate format (Proxy, LT, Standard, HQ, 4444)
- **Quality presets** - 4K @ 60fps, 1080p, 720p, 480p
- **Custom settings** - Bitrate, frame rate, codec options, color depth
- **Hardware encoding** - WebCodecs for fast exports
- **AI upscaling** - Enhance resolution with WebGPU shaders
- **Audio export** - MP3, WAV, AAC, FLAC, OGG
- **Image sequences** - JPG, PNG, WebP frame export
- **Progress tracking** - Real-time progress with cancel support

### Professional Tools
- **Unlimited undo/redo** - Full history with recovery
- **Auto-save** - Never lose work (IndexedDB storage)
- **Keyboard shortcuts** - Professional workflow
- **Snap to grid** - Magnetic alignment
- **Track management** - Show/hide, lock/unlock, reorder
- **Subtitle support** - SRT import with customizable styling
- **Screen recording** - Record screen, camera, or both
- **Project sharing** - Export/import project files

### Performance
- **WebGPU rendering** - GPU-accelerated compositing
- **WebCodecs API** - Hardware video decoding/encoding
- **Frame caching** - LRU cache for smooth playback
- **Web Workers** - Background processing
- **4K support** - Edit and export in 4K resolution

---

## Quick Start

### Try Online
Visit **[openreel.video](https://openreel.video)** to start editing immediately.

To edit by chatting with OpenAI, Anthropic, or any OpenAI-compatible endpoint, follow the
**[AI Editor setup guide](docs/AGENT-GUIDE.md#bring-your-own-key-web--desktop-chat)**.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Augani/openreel-video.git
cd openreel-video

# Install dependencies (requires Node.js 18+)
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

### Build for Production

```bash
pnpm build
pnpm preview
```

---

## 휴대폰에서 쓰기 (story-cut 연동)

> 이 포크([Firstund/openreel-video](https://github.com/Firstund/openreel-video))에 추가된 기능입니다. 자동 편집 초안은 [story-cut](https://github.com/Firstund/story-cut)이 PC에서 만듭니다.

OpenReel은 브라우저 안에서 동작하는 편집기라, 폰에서 열면 폰이 편집을 합니다. 폰 화면용 편집 UI(탭해서 클립 선택, 두 손가락으로 확대, 큰 트림 손잡이, 아래쪽 도구 막대, 폰용 내보내기)는 이미 들어 있습니다. 다만 폰 브라우저는 **https 주소**에서만 영상 편집 기능을 열어 주기 때문에, PC에서 아래처럼 켜야 합니다.

### Windows PC에서 준비 (처음 한 번)

```powershell
cd D:\_ForBroadcast\openreel-video
git pull
pnpm install
```

### 켜기

```powershell
cd D:\_ForBroadcast\openreel-video
pnpm dev:remote
```

창에 이런 줄이 나옵니다.

```
  휴대폰 접속 (OpenReel + story-cut):
    같은 와이파이  https://192.168.0.12:5173/storycut/?token=AbCdEf12345
    Tailscale      https://100.101.102.103:5173/storycut/?token=AbCdEf12345
  접속 비밀번호: AbCdEf12345
```

- 폰 브라우저에 그 주소를 입력합니다. **"연결이 비공개로 설정되어 있지 않습니다"** 경고가 나오면 **고급 → (주소)로 이동**을 누릅니다. PC가 직접 만든 인증서라서 처음 한 번 나옵니다.
- `/storycut/`은 PC의 story-cut 화면입니다. story-cut이 꺼져 있으면 켜는 방법이 안내됩니다. ([story-cut 휴대폰 안내](https://github.com/Firstund/story-cut#휴대폰에서-쓰기))
- 편집기만 열려면 주소 끝의 `/storycut/`을 빼고 `https://192.168.0.12:5173/?token=...` 로 엽니다.
- 처음 켜면 Windows 방화벽 창이 뜰 수 있습니다. **개인 네트워크** 체크 후 **허용**.
- PC에서 쓸 때는 지금처럼 `pnpm dev` 그대로 쓰면 됩니다 (비밀번호 없음, 이 PC에서만 열림).

### 집 밖에서 (Tailscale)

1. PC와 폰에 [Tailscale](https://tailscale.com/download)을 설치하고 같은 계정으로 로그인합니다.
2. `pnpm dev:remote`를 켜면 `Tailscale  https://100.x.y.z:5173/...` 줄이 나옵니다. 그 주소를 폰에서 엽니다.
3. 포트 열기나 공유기 설정은 필요 없습니다. 내 기기끼리만 연결됩니다.

### story-cut 결과를 폰에서 다듬기

1. story-cut 화면의 결과에서 **OpenReel (폰용 가벼운 영상)** 을 누르면, 편집기가 열리고 초안과 영상이 자동으로 들어갑니다. (Edit JSON 메뉴나 Relink를 손으로 할 필요 없음)
2. 클립을 탭해서 고르고, 양쪽 초록 손잡이로 길이를 조절합니다. 두 손가락으로 타임라인을 확대/축소합니다.
3. 다 고쳤으면 오른쪽 아래 **story-cut으로 보내기** → story-cut 화면에서 **PC에서 MP4 만들기**. 폰에서 고친 내용이 원본 화질로 PC에서 만들어집니다.
   - 폰에서 바로 **Export**를 눌러도 되지만, 가벼운 영상(540p)으로 열었다면 결과도 그 화질입니다.

### 보안

- `pnpm dev:remote`는 비밀번호가 있어야 열립니다. 비밀번호는 story-cut과 같은 것을 씁니다 (`C:\Users\내이름\.story-cut\token`).
- 개발 서버라서 인터넷에 공개(포트 포워딩)하지 마세요. 집 밖에서는 Tailscale을 쓰세요.

## Browser Requirements

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 94+ | Full support |
| Edge | 94+ | Full support |
| Firefox | 130+ | Full support |
| Safari | 16.4+ | Full support |

All major browsers now support WebCodecs for hardware-accelerated video encoding/decoding.

**Recommended:**
- 8GB+ RAM (16GB+ recommended for 4K; see [docs/known-limitations.md](docs/known-limitations.md))
- Dedicated GPU for 4K editing
- Modern multi-core CPU

---

## Architecture

### Monorepo Structure

```
openreel/
├── apps/web/              # React frontend (~66k lines)
│   └── src/
│       ├── components/    # UI components
│       │   └── editor/    # Editor panels (Timeline, Preview, Inspector)
│       ├── stores/        # Zustand state management
│       ├── services/      # Auto-save, shortcuts, screen recording
│       └── bridges/       # Engine coordination
│
└── packages/core/         # Core engines (~59k lines)
    └── src/
        ├── video/         # Video processing, WebGPU rendering
        ├── audio/         # Web Audio API, effects, beat detection
        ├── graphics/      # Canvas/THREE.js, shapes, SVG
        ├── text/          # Text rendering, animations
        ├── export/        # MP4/WebM encoding
        └── storage/       # IndexedDB, serialization
```

### Key Technologies

- **React 18** + **TypeScript** - Type-safe UI
- **Zustand** - Lightweight state management
- **MediaBunny** - Video/audio processing
- **WebCodecs** - Hardware encoding/decoding
- **WebGPU** - GPU-accelerated rendering
- **Web Audio API** - Professional audio processing
- **THREE.js** - 3D transforms and effects
- **IndexedDB** - Local project storage

### Design Principles

- **Action-based editing** - Every edit is an undoable action
- **Immutable state** - Predictable updates with Zustand
- **Engine separation** - Video, audio, graphics engines are independent
- **Progressive enhancement** - Graceful fallbacks (WebGPU → Canvas2D)

---

## AI-Managed Development

OpenReel is an experiment in AI-assisted open source development. Claude AI helps manage:

- **Issue triage** - Reviews and responds to issues
- **Code implementation** - Writes features and fixes bugs
- **Code review** - Maintains quality standards
- **Documentation** - Keeps docs up to date

Human oversight from Augustus ensures strategic direction and final approval on major changes. All code is public, tested, and follows best practices.

**What this means for contributors:**
- Issues get reviewed quickly (usually within 24 hours)
- Bug fixes ship fast
- Clear, detailed responses to questions
- High code quality standards

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report bugs with reproduction steps
- Suggest features in Discussions
- Submit PRs for bugs or features
- Improve documentation
- Write tests
- Share effect presets

**Development workflow:**
```bash
# Fork and clone
git clone https://github.com/Augani/openreel-video.git

# Create feature branch
git checkout -b feat/your-feature

# Make changes, then test
pnpm typecheck
pnpm test
pnpm lint

# Commit with conventional commits
git commit -m "feat: add your feature"

# Push and open PR
git push origin feat/your-feature
```

---

## Roadmap

### Completed
- Multi-track timeline with drag-and-drop
- Real-time video preview with GPU acceleration
- Full editing suite (cut, trim, split, transitions)
- Text editor with 20+ animations
- Graphics (shapes, SVG, stickers, backgrounds)
- Audio mixing with effects and beat detection
- Color grading with LUT support
- Keyframe animation system
- Export to MP4/WebM (4K supported)
- Screen recording
- AI upscaling
- Undo/redo with auto-save

### In Progress
- Nested sequences (timeline in timeline)
- Motion tracking
- More export formats (ProRes, GIF)
- Plugin system

### Planned
- Adjustment layers
- Advanced masking
- Audio spectral editing
- Collaborative editing
- Mobile optimization

---

## License

MIT License - Use freely for personal and commercial projects.

See [LICENSE](LICENSE) for details.

---

## Acknowledgments

**Built with:**
- [MediaBunny](https://mediabunny.dev) - Media processing
- [React](https://react.dev) - UI framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [THREE.js](https://threejs.org) - 3D rendering
- [TailwindCSS](https://tailwindcss.com) - Styling

**Inspired by:**
- DaVinci Resolve - Professional tools done right
- CapCut - Accessible editing for everyone
- Figma - Browser-based professional software

---

## Support

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community chat
- **Twitter/X** - [@python_xi](https://x.com/python_xi)

---

## $OPENREEL Token

CA: `B7wDnfrdtvdG7SCkRjSMJ6LkVwGWvdWrQ75iV8G9pump`

---

**Built with care by [@python_xi](https://x.com/python_xi) and AI working together.**

*Making professional video editing accessible to everyone. Forever free. Forever open source.*
