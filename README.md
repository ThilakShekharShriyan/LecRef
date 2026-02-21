# lecRef - Real-Time AI Study Companion

Demo: https://youtu.be/Trzf2DNv3ik

Figma Design: https://www.figma.com/design/RGNJNwZZM3iOOuNQ0T2nyg/lecRef-AI-Lecture-Assistant

GitHub: https://github.com/arnxv0/lecRef

---

## The Problem

When you sit in a lecture, curiosity happens in flashes. A professor mentions a concept you half-recognize. A name comes up you've heard before but can't place. A term gets used that you don't fully understand but the lecture keeps moving.

In that moment, you have two options. You can stop and Google it — but now you've lost the thread of what's being said. Or you can let it go and tell yourself you'll look it up later — but you rarely do.

That gap is where learning gets lost. Not because students aren't curious, but because the friction of acting on that curiosity in the moment is too high. Lectures move fast. There's no pause button on a professor.

Curiosity is the most powerful driver of learning. But it only turns into knowledge if something catches it before it disappears. That's the problem lecRef is trying to solve.

---

## What lecRef Does

lecRef listens to your lecture alongside you. As terms and concepts come up, it quietly looks them up in real time and shows you definitions and sources in a sidebar - without interrupting the flow of the lecture.

If something comes up that you want to understand more deeply, you can highlight any part of the live transcript and ask for a full research dive on it. lecRef pulls from multiple web sources, synthesizes the information, and shows you a proper explanation with citations.

At the end of the session, you have a clean summary, a list of key takeaways, and a full export of every term and concept that came up.

This is something I personally wanted to exist. I built it because I kept losing threads in lectures and seminars, and I wanted something that would catch those moments for me without requiring me to do anything.

---

## Sponsors and How We Used Them

### Figma

We used Figma Make to start the entire product. Before writing any code, we described the app in plain language and Figma Make generated the initial screens and layout.

The prototype has five connected screens with one clear user flow:

1. Startup screen
2. Onboarding — explains the app and asks for microphone permission
3. Lectures dashboard — all past sessions, each resumable or exportable
4. Active session — live transcript, real-time definition cards, research panel
5. Export view — full notes and summary from the session

Figma Make let us go from idea to clickable prototype in under an hour. It defined the visual direction before we touched the code.

---

### Smallest AI

Smallest AI is how lecRef listens. We use the Pulse real-time streaming model for low-latency transcription.

The browser captures your microphone or screen audio and streams it to the backend in real time. The backend forwards each audio chunk directly to Smallest AI's WebSocket API. Smallest AI sends back partial transcripts as you speak, and marks utterances as final when a sentence is complete.

That confirmed sentence is the trigger for everything else in the app. Smallest AI turns raw speech into structured, usable text, which makes the whole pipeline possible.

---

### Gemini

Gemini powers the definitions and deep research in lecRef. We use it in two ways.

The first is automatic. Every time Smallest AI confirms a sentence, lecRef extracts the key terms and asks Gemini to define them in context.

The second is on demand. If you highlight a phrase in the live transcript, lecRef asks Gemini for a deeper explanation tailored to the surrounding context.

---

### Kilo Code

We used Kilo Code as our coding assistant throughout the build.

The backend is a non-trivial system — async pipelines, WebSocket state, parallel API calls, real-time audio forwarding, and database writes all running together. Kilo helped us move fast without losing control of the complexity.

lecRef started as something I wanted to exist for myself. Kilo is a big part of why it actually shipped as a working product instead of staying as a half-finished side project.

---

### Gemini Flash

We use Gemini 2.0 Flash for all inference tasks in the pipeline.

When Smallest AI confirms a sentence, Gemini reads it and pulls out two or three key concepts worth looking up. It classifies each one as a concept, person, or event, and those become definition cards.

Every sixty seconds, Gemini reads the full transcript buffer and rewrites the rolling lecture summary.

When a user triggers a manual deep research, Gemini writes a single, readable answer tailored to the lecture context.

Gemini Flash is fast enough to run on every utterance without adding delay to the pipeline.

---

## Running Locally

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher

### 1. Clone the repo

```bash
git clone https://github.com/arnxv0/lecRef.git
cd lecRef
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Add your API keys

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
SMALLEST_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
DATABASE_URL=sqlite+aiosqlite:///./lecref.db
```

| Key | Where to get it |
|-----|-----------------|
| SMALLEST_API_KEY | console.smallest.ai |
| GEMINI_API_KEY | aistudio.google.com/app/apikey |

### 4. Start the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API runs at http://localhost:8000
Docs at http://localhost:8000/docs

### 5. Start the frontend

```bash
# From the repo root
npm install
npm run dev
```

Frontend runs at http://localhost:5173

