# AetherChat - Premium AI Conversations

This is a Next.js application bootstrapped with `create-next-app` and enhanced for Firebase integration and AI chat features.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Set up Firebase Environment Variables:**
    -   Copy the example environment file:
        ```bash
        cp .env.local.example .env.local
        ```
    -   Open `.env.local` and replace the placeholder values with your actual Firebase project credentials. You can find these in your Firebase project settings under **Project settings > General > Your apps > Web app > SDK setup and configuration > Config**.
    -   **(Optional)** If you plan to use Google AI features via Genkit, uncomment and add your `GOOGLE_GENAI_API_KEY`.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  **(Optional) Run Genkit Development Server (for AI flows):**
    If you are developing AI features, run this in a separate terminal:
    ```bash
    npm run genkit:dev
    # or use watch mode
    npm run genkit:watch
    ```

Open [http://localhost:9002](http://localhost:9002) (or your specified port) with your browser to see the result.

## Key Features Implemented

*   **Landing Page:** A visually appealing entry point for the application.
*   **Firebase Authentication:** Secure user sign-up and login using email/password.
*   **Firestore Database:** Storing user chat history and messages.
*   **Chat Interface:** Real-time chat display with user and AI messages.
*   **Multiple Chats:** Ability to create new chat sessions, stored and listed in the sidebar.
*   **Subscription Page (Placeholder):** UI for different subscription tiers.
*   **Settings Page (Placeholder):** UI for user account settings.
*   **Styling:** Uses Tailwind CSS and ShadCN UI components with a custom theme (Deep Gold, Dark Grey, Emerald Green accents).
*   **AI Integration (Genkit):** Placeholder Genkit flows for potential AI features (e.g., chat summarization, prompt improvement).

## Learn More

To learn more about the technologies used, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Firebase Documentation](https://firebase.google.com/docs) - learn about Firebase services.
*   [Genkit Documentation](https://firebase.google.com/docs/genkit) - learn about Genkit for AI flows.
*   [ShadCN UI Documentation](https://ui.shadcn.com/docs) - learn about the UI components used.
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS utility classes.
