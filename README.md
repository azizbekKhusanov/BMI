# IDROK - Metacognitive Web Learning Platform

![Project Banner](./public/banner.png) *(Note: You can add a banner image to the public folder and link it here)*

**IDROK** (Intelligence/Perception) is a modern, AI-powered web educational platform designed to develop digital metacognitive skills in students. This project was built as a Graduation Qualification Work (Diploma Project) on the topic: *"Talabalarda raqamli metakognitiv ko‘nikmalarni rivojlantiruvchi web-o‘quv platformasini yaratish"*.

Unlike traditional LMS (Learning Management Systems) that solely focus on delivering content, IDROK integrates a **Metacognitive AI Mentor** to guide students through the *Planning, Monitoring, and Evaluation* phases of learning.

## 🌟 Key Features

### 👨‍🎓 For Students
*   **Metacognitive Learning Cycle**: Pre-lesson self-assessment (Planning), in-lesson AI guidance (Monitoring), and post-lesson reflection (Evaluation).
*   **AI Mentor**: A built-in chat interface powered by Groq (Llama 3.3) that uses the Socratic method to stimulate critical thinking rather than just giving direct answers.
*   **Calibration Tracking**: Measures the gap between a student's predicted score and their actual test score to improve self-awareness.
*   **Interactive Lessons**: Support for video, text, and mixed-media content.
*   **Real-time Messaging**: Direct and seamless communication with teachers.

### 👨‍🏫 For Teachers
*   **Advanced Analytics Dashboard**: Track not just grades, but students' metacognitive depth, reflections, and calibration errors.
*   **AI Test Generation**: Automatically generate multiple-choice quizzes based on the course and lesson topic using AI.
*   **Course & Lesson Management**: Create, edit, and publish courses with rich content.
*   **Student Monitoring**: Identify "at-risk" students who need attention based on their performance and reflection data.
*   **Teacher Messaging System**: Unified interface to communicate with students and track their inquiries.

## 🛠 Tech Stack

*   **Frontend**: React.js, TypeScript, Vite
*   **Styling**: Tailwind CSS, shadcn/ui (Radix UI primitives)
*   **Backend / Database**: Supabase (PostgreSQL, Auth, Storage)
*   **AI Integration**: Groq SDK (Llama-3.3-70b-versatile model)
*   **Icons**: Lucide React
*   **State Management/Routing**: React Router DOM, Context API

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components (shadcn, layout, etc.)
├── contexts/       # React contexts (AuthContext)
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations (Supabase client & types)
├── lib/            # Utility functions and AI logic (groq.ts, utils.ts)
├── pages/          # Application pages (Dashboards, Courses, Lessons, etc.)
└── index.css       # Global styles and Tailwind directives
```

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or bun package manager
*   Supabase Account
*   Groq API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/azizbekKhusanov/BMI.git
    cd BMI
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory and add your keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GROQ_API_KEY=your_groq_api_key
    ```

4.  **Database Setup**
    Run the SQL script located at `setup_database.sql` in your Supabase SQL Editor to create the necessary tables, types, and Row Level Security (RLS) policies.

5.  **Run the development server**
    ```bash
    npm run dev
    # or
    bun run dev
    ```

6.  **Open the app**
    Visit `http://localhost:8080` in your browser.

## 🛡 Security & Authentication
*   **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for `student` and `teacher` roles.
*   **Row Level Security (RLS)**: Supabase policies ensure users can only access their own data, while teachers can securely access their students' data.

## 🧠 Metacognitive AI Logic
The core AI logic is handled in `src/lib/groq.ts`. It uses structured prompts to force the LLM to output specific JSON formats for test generation and reflection analysis, while using an open-ended conversational style with the Socratic method for the student mentor.

## 📝 License
This project was developed for academic purposes as a Graduation Qualification Work.
