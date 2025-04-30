# eČtenářák (Digital Reading Journal)

A modern web application for managing your reading journal and tracking your reading progress. It allows users to record read books, write notes, and easily remember content and ideas from their reading.

## Features

- **MongoDB Integration**: User accounts, book libraries, author information, and notes are stored in MongoDB.
  - User-specific libraries.
  - Books linked to users.
  - Shared author information database.
  - Notes stored as part of book entries.
- **OpenAI API Integration**:
  - Generate AI-powered summaries of your book notes.
  - Generate summaries for authors (checks database for existing summaries to optimize API usage).
- **Token Usage Optimization**:
  - **Shared Author Summaries**: Reuses existing author summaries from the database instead of generating new ones.
  - **Caching**: Generated summaries are cached in MongoDB for future use.
- Add books to your reading list.
- Take notes for each book.
- Clean and modern UI built with Tailwind CSS.

## Technologies Used

- Next.js 14
- React
- TypeScript
- MongoDB
- Mongoose
- OpenAI API
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (Check `.nvmrc` or `package.json` for specific version if available)
- npm or yarn
- MongoDB instance (local or remote)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd ctenarsky-denik
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  Create a `.env.local` file in the root directory and add your environment variables. You can copy the example file if one exists (`cp .env.example .env.local`) or create it manually:
    ```dotenv
    MONGODB_URI=your_mongodb_connection_string # e.g., mongodb://localhost:27017/ctenarsky-denik
    OPENAI_API_KEY=your_openai_api_key_here
    ```
    Replace the placeholder values with your actual MongoDB connection string and OpenAI API key.

### Running the Development Server

1.  Start the development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  Log in using your email and name (or follow the application's specific authentication flow).
2.  Add books to your library using the title input.
3.  Click on a book to expand it.
4.  Add notes about the book.
5.  Optionally, request an AI-generated summary for the author.
6.  Generate an AI summary of your notes by clicking the "Generate Summary" button (or similar).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. (Consider adding more specific contribution guidelines).

## License

(Specify the license for your project here, e.g., MIT License).

## Learn More (Next.js)

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
