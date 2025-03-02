# Čtenářský deník

Aplikace pro správu vašich knih a poznámek s podporou AI pro generování shrnutí.

## Nové funkce

### MongoDB integrace

Aplikace nyní používá MongoDB pro ukládání dat:

- **Uživatelé**: Každý uživatel má svůj vlastní účet a knihovnu knih
- **Knihy**: Knihy jsou uloženy v MongoDB a propojeny s uživatelem
- **Autoři**: Informace o autorech jsou sdíleny mezi uživateli
- **Poznámky**: Poznámky jsou uloženy jako součást knih

### Optimalizace využití tokenů

Pro snížení nákladů na API volání OpenAI jsme implementovali následující optimalizace:

1. **Sdílení shrnutí autorů**: Když uživatel požádá o shrnutí autora, systém nejprve zkontroluje, zda již existuje shrnutí tohoto autora v databázi. Pokud ano, použije se existující shrnutí místo generování nového.

2. **Cachování výsledků**: Všechna vygenerovaná shrnutí jsou uložena v MongoDB pro budoucí použití.

## Instalace

1. Naklonujte repozitář
2. Nainstalujte závislosti: `npm install`
3. Vytvořte soubor `.env.local` s následujícími proměnnými:
   ```
   MONGODB_URI=mongodb://localhost:27017/ctenarsky-denik
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Spusťte vývojový server: `npm run dev`

## Použití

1. Přihlaste se pomocí e-mailu a jména
2. Přidejte knihy do své knihovny
3. Volitelně nechte vygenerovat shrnutí o autorovi
4. Přidávejte poznámky ke knihám
5. Generujte AI shrnutí vašich poznámek

## Technologie

- Next.js
- React
- TypeScript
- MongoDB
- Mongoose
- OpenAI API
- Tailwind CSS

## Features

- Add books to your reading list
- Take notes for each book
- Generate AI-powered summaries of your notes using OpenAI
- Clean and modern UI with Tailwind CSS

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env` file and add your OpenAI API key:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your OpenAI API key

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Add a new book by entering its title in the input field at the top of the page
2. Click on a book to expand it and view its notes
3. Add notes about the book using the note input field
4. Once you have added some notes, you can generate an AI summary by clicking the "Generate Summary" button

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI API

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
