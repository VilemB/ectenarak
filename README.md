# 📖 eČtenářák (Digital Reading Journal)

A modern web application for managing your reading journal and tracking your reading progress. Record read books, write notes, and easily recall content and ideas from your reading.

---

## ✨ Features

- **📚 Book & Note Management**:
  - Add books to your personal reading list.
  - Take detailed notes for each book.
  - User-specific libraries ensure privacy.
- **🧠 AI-Powered Summaries**:
  - Generate summaries of your book notes using OpenAI.
  - Get AI-generated summaries for authors.
- **💡 Smart Optimizations**:
  - **Shared Author Summaries**: Reuses existing author summaries from the database to minimize API calls and costs.
  - **Caching**: Generated summaries are stored in MongoDB for quick retrieval.
- **👤 User Accounts**: Securely manage your reading data.
- **🎨 Modern UI**: Clean interface built with Tailwind CSS.

---

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js
- **Database**: MongoDB (with Mongoose)
- **AI**: OpenAI API

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or remote)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ctenarsky-denik
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory:
    ```dotenv
    MONGODB_URI=your_mongodb_connection_string # e.g., mongodb://localhost:27017/ctenarsky-denik
    OPENAI_API_KEY=your_openai_api_key_here
    ```
    Replace placeholders with your actual MongoDB connection string and OpenAI API key.

### Running the Development Server

1.  **Start the server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
2.  **Access the app:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💻 Usage Guide

1.  **Log In**: Use your email and name (or follow the app's specific login method).
2.  **Add Books**: Use the title input to add books to your library.
3.  **View & Edit**: Click a book to expand its details and add/view notes.
4.  **Author Summaries**: Request an AI-generated summary for an author (if available).
5.  **Note Summaries**: Generate an AI summary of your notes using the dedicated button.

---

## 📜 License

(Specify the license for your project here, e.g., MIT License)

---

## 📚 Learn More (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js Tutorial](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

---

## ☁️ Deploy on Vercel

Deploy easily using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
