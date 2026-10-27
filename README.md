# GapFinder AI

> **Syllabus-Grounded Diagnostic Intelligence**  
> *"Students cannot ask about a gap they do not know they have."*

Most study tools wait for students to ask a question. **GapFinder AI** takes a student's actual syllabus, lecture notes, and past exam papers, diagnostically tests their knowledge, uncovers hidden conceptual gaps, and automatically crafts an adaptive revision calendar.

---

## 🚀 Key Features

### 1. Split-Screen Welcome & Authentication
* **Split-Screen Design**: High-definition academic campus illustration of students carrying textbooks with branding and tagline.
* **Instant 1-Click Demo Profiles**: Quick sign-in buttons for **Student** (`judge@gapfinder.ai`) and **Teacher** (`teacher@gapfinder.ai`).
* **Custom Registration**: Full Sign Up support with role selection (Student or Lecturer) and automatic sample syllabus seeding.

### 2. Role-Based Dashboards
* **Student Dashboard**: Quick access to diagnostic metrics, revision dials, daily focus timer, and study timeline. Left sidebar navigation:
  * **Home** (`/dashboard`)
  * **Study Materials** (`/materials`)
  * **Topic Map** (`/topics`)
  * **Diagnostic Quiz** (`/quiz`)
  * **Learning Gaps** (`/report`)
  * **Revision Planner** (`/plan`)
  * **AI Study Assistant** (`/assistant`)
  * **Voice Learning** (`/voice`)
  * **Ask My Lecturer** (`/lecturer`)
  * **Progress** (`/progress`)
  * **Settings** (`/settings`)
* **Teacher / Lecturer Dashboard**: Class-wide diagnostic analytics, student roster, and friction indices. Left sidebar navigation:
  * **Diagnosis Overview** (`/dashboard`)
  * **Study Materials** (`/materials`)
  * **Syllabus Topic Map** (`/topics`)
  * **Diagnostic Quizzes** (`/quiz`)
  * **Gap Report** (`/report`)
  * **Adaptive Plan** (`/plan`)
  * **Explain This Topic** (`/assistant`)
  * **Mastery & Progress** (`/progress`)
  * **Students** (`/students`)
  * **Settings** (`/settings`)

### 3. Multilingual Learning
* Explanations and doubts clarification available in 6 languages:
  * **English** (`en`)
  * **Telugu** (`te` - తెలుగు)
  * **Hindi** (`hi` - हिन्दी)
  * **Tamil** (`ta` - தமிழ்)
  * **Kannada** (`kn` - ಕನ್ನಡ)
  * **Malayalam** (`ml` - മലയാളം)
* Seamless in-chat language switching and default preference configuration in Settings.

### 4. Voice Learning Studio
* **Speech-to-Text**: Hands-free voice inquiry input using browser Speech Recognition in the selected regional language.
* **Text-to-Speech**: Listen to synthesized audio explanations with playback controls.
* **One-Click Audio Recaps**: Quick spoken recaps of identified weak chapters.

### 5. AI Study Assistant with Grounded Citations
* Strictly constrained Retrieval-Augmented Generation (RAG) using hybrid BM25 and vector embeddings.
* Every synthesized answer includes clickable grounding citations (Document, Section, Excerpt) to prevent hallucinations.

### 6. Lecturer Communication
* **Ask My Lecturer**: Students can submit specific conceptual doubts with syllabus topic tagging.
* **Lecturer Clarifications**: Teachers review student inquiries, post authoritative replies, and mark items resolved.

### 7. Interactive Diagnostic Quizzes & Adaptive Plan
* Stepper quiz interface with session timers and targeted unit drills.
* Dynamic diagnostic ratings: **Weak** (critical gap), **Review** (partial recall), and **Mastered**.
* Adaptive revision planner with daily hour budgeting, Pomodoro sprint timer, and interactive task completion checklists.

---

## 🔑 Demo Credentials

| Role | Email | Password | Preloaded Corpus |
| :--- | :--- | :--- | :--- |
| **Student** | `judge@gapfinder.ai` | `Demo@123` | CBSE Class 12 CS (Functions, SQL, Networks, Past Papers) |
| **Teacher** | `teacher@gapfinder.ai` | `Demo@123` | Class 12 CS Curriculum & Student Cohort |

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite (local) / PostgreSQL (production)
* **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials Provider with JWT sessions)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom font variables (`Fraunces` & `Outfit`)
* **AI & RAG Engine**: Vercel AI SDK with multi-provider fallback (Groq, Google Gemini, OpenAI) and BM25 hybrid vector retrieval
* **Speech & Audio**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js**: v20 or later
* **npm**: v10 or later

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gapfinder-ai.git
   cd gapfinder-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *(Optionally add an API key for Groq, Google Gemini, or OpenAI to enable live generative AI responses. If omitted, the app functions offline via deterministic lexical extraction.)*

4. **Initialize Database & Seed Sample Data**:
   ```bash
   npm run db:setup
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Connection string for SQLite or PostgreSQL | `file:./dev.db` (local) |
| `NEXTAUTH_URL` | **Yes** | Canonical URL of the application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | **Yes** | Secret string for session token encryption | `generate-with-openssl-rand-base64-32` |
| `GROQ_API_KEY` | Optional | Groq API key (Llama 3.3) | `gsk_...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Google Gemini API key | `AIzaSy...` |
| `OPENAI_API_KEY` | Optional | OpenAI API key | `sk-...` |
| `EMBEDDING_PROVIDER` | Optional | Embeddings provider (`google` or `openai`) | Leave blank for offline BM25 |

---

## 🚢 Deployment to Vercel

GapFinder AI is built for one-click deployment on [Vercel](https://vercel.com/):

### 1. Database Provisioning (Production PostgreSQL)
Because Vercel runs in ephemeral serverless lambdas, local SQLite files reset between invocations. For production:
1. Create a serverless PostgreSQL database using [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).
2. Copy the pooled connection string (e.g. `postgresql://user:pass@host/db?sslmode=require`).

### 2. Prisma Production Provider
In `prisma/schema.prisma`, update the datasource provider for production:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Push the schema to your production database:
```bash
npx prisma db push
npm run db:seed
```

### 3. Vercel Project Configuration
1. Push your repository to **GitHub**.
2. Import the repository into **Vercel**.
3. In **Project Settings -> Environment Variables**, configure:
   * `DATABASE_URL`
   * `NEXTAUTH_URL` (`https://your-domain.vercel.app`)
   * `NEXTAUTH_SECRET` (generate via `openssl rand -base64 32`)
   * `GROQ_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` or `OPENAI_API_KEY`
4. The `package.json` includes `postinstall: prisma generate` and `build: prisma generate && next build` to guarantee client generation during Vercel builds.
5. Click **Deploy**.

---

## 🛡️ License

MIT License. Designed and developed for syllabus-grounded diagnostic learning.

