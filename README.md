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

OpenReel은 브라우저 안에서 동작하는 편집기라, 폰에서 열면 폰이 편집을 합니다. 폰에서는 한국어 **간편 모드**(클립 / 자막 / AI / 내보내기 탭)가 자동으로 열리고, 원하면 전체 편집기로 바꿀 수 있습니다. 다만 폰 브라우저는 **https 주소**에서만 영상 편집 기능을 열어 주기 때문에, PC에서 아래처럼 켜야 합니다.

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

처음 켤 때와 `git pull`로 업데이트한 직후에는 **폰용 화면을 먼저 빌드하느라 1~3분** 걸립니다 (`OpenReel 폰용 화면을 준비(빌드)하는 중입니다...`). 그다음부터는 바로 켜집니다. 다 되면 창에 이런 줄이 나옵니다.

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
- 5173 포트가 이미 쓰이고 있다는 오류가 나면, 남아 있는 node를 끄고 다시 켭니다: `Get-Process node | Stop-Process -Force` (story-cut 창은 영향 없음. 단, 다른 node 프로그램도 같이 꺼집니다)
- PC에서 쓸 때는 지금처럼 `pnpm dev` 그대로 쓰면 됩니다 (비밀번호 없음, 이 PC에서만 열림).
- 왜 빌드하나요? 개발 서버(`pnpm dev`)는 파일 약 1,400개를 따로 보내서, 폰에서 열면 **흰 화면이 오래** 이어졌습니다 (PC가 만든 인증서라 폰 브라우저가 저장해 두지도 않음). 빌드한 화면은 파일 200여 개라 몇 초 만에 열립니다. 코드를 고치면서 바로 반영되는 개발 서버가 필요하면 `pnpm dev:remote --dev`, 빌드를 강제로 다시 하려면 `pnpm dev:remote --rebuild`.
- 이제 여는 동안 **"OpenReel 불러오는 중..."** 과 진행 상황(초안 받는 중 → 영상 받는 중 N/68 MB → 여는 중)이 보이고, 문제가 생기면 이유와 **다시 시도** 버튼이 화면에 나옵니다.

### 집 밖에서 (Tailscale)

1. PC와 폰에 [Tailscale](https://tailscale.com/download)을 설치하고 같은 계정으로 로그인합니다.
2. `pnpm dev:remote`를 켜면 `Tailscale  https://100.x.y.z:5173/...` 줄이 나옵니다. 그 주소를 폰에서 엽니다.
3. 포트 열기나 공유기 설정은 필요 없습니다. 내 기기끼리만 연결됩니다.

### story-cut 결과를 폰에서 다듬기

1. story-cut 화면의 결과에서 **OpenReel (폰용 가벼운 영상)** 을 누르면, 편집기가 열리고 초안과 영상이 자동으로 들어갑니다. (Edit JSON 메뉴나 Relink를 손으로 할 필요 없음)
   - 가벼운 영상(540p)은 분석이 끝나면 PC가 자동으로 만들어 둡니다. 20분 영상 기준 약 70MB 정도이고, 와이파이에서 15초 안팎에 열립니다. 아직 만드는 중이면 버튼에 `준비 중 N%`가 보입니다.
   - 폰에서 **원본 영상**으로 열면 몇 GB를 폰으로 받아야 해서 매우 느립니다. 폰에서는 가벼운 영상을 쓰세요.
2. 폰에서는 **간편 모드**(한국어, 큰 버튼, 세로 화면)로 열립니다. 위는 미리보기, 그 아래 전체 클립 막대(탭/드래그로 이동)와 재생 버튼, 맨 아래 탭 4개입니다.
   - **클립**: 클립을 탭하면 그 위치로 이동하고 편집 칸이 열립니다. 큰 손잡이 두 개로 앞/뒤 자르기, `0.5초` 버튼으로 미세 조절, **여기서 시작/끝**(재생 위치 기준), **여기서 나누기**, **삭제**. 왼쪽 `⋮⋮` 손잡이를 끌거나 ▲▼로 순서를 바꿉니다. 빈틈은 자동으로 메워지고 자막도 같이 따라갑니다. 위쪽 ↶ ↷ 로 되돌리기/다시 하기.
   - **자막**: 자막 줄 목록. 줄을 탭하면 그 위치로 가고 글자 고치기, 시작/끝 0.1초 조절, 삭제를 할 수 있습니다. 재생 중에는 지금 줄이 표시됩니다. 아래 **재생 위치에 자막 추가**.
   - **AI**: PC의 LM Studio로 말로 편집합니다 (예: "3번 클립 지워줘", "2번 클립을 맨 뒤로 옮겨줘"). 폰은 PC를 거쳐 LM Studio에 연결되므로 폰에 설치할 것은 없습니다. PC의 LM Studio에서 **Developer → Status: Running**으로 서버를 켜고 모델을 불러 두세요 (포트가 1234가 아니면 `set LMSTUDIO_PORT=포트` 후 `pnpm dev:remote`). 편집 전에 **하기 / 하지 않기**를 묻고, **AI 편집 되돌리기**로 한 번에 취소할 수 있습니다.
   - **내보내기**: **1. story-cut으로 보내기** → **2. PC에서 MP4 만들기 (원본 화질)** 또는 **폰용 작게 (720p)**. 다 되면 **폰에 저장**. (2번만 눌러도 먼저 보내기를 자동으로 합니다.) 폰에서 직접 만들기도 있지만 느리고 가벼운 영상 화질입니다.
   - 오른쪽 위 ☰ 메뉴: **한국어 / English**, **전체 편집기로 전환**. 전체 편집기에서는 왼쪽 아래 **간편 모드로** 버튼으로 돌아옵니다 (선택은 기억됩니다). 전체 편집기 자체는 영어입니다.
3. 전체 편집기에서 고쳤다면 오른쪽 아래 **story-cut으로 보내기** → story-cut 화면에서 **PC에서 MP4 만들기**.

### 보안

- `pnpm dev:remote`는 비밀번호가 있어야 열립니다. 비밀번호는 story-cut과 같은 것을 씁니다 (`C:\Users\내이름\.story-cut\token`).
- 인터넷에 공개(포트 포워딩)하지 마세요. 집 밖에서는 Tailscale을 쓰세요.
- 창의 주소 목록에 **`공인 IP ⚠`** 가 보이면 PC가 공유기 없이 인터넷에 바로 연결된 상태입니다. 비밀번호가 있어야 열리지만, 그 주소는 남에게 알려 주지 말고 가능하면 Tailscale 주소를 쓰세요.

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
