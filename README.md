# Clerk Integration Helper

run and install dep and fis any issue: Do NOT add a dev-mode authentication bypass yet.

This project was imported from a Replit project that was already under development. My goal is to continue the project from the exact point where the previous Replit Agent stopped, not to create a new implementation.

Please do the following first:

1. Inspect the existing source code and documentation.

2. Determine exactly how Clerk is currently integrated.

3. Identify where the application expects:

   - CLERK_PUBLISHABLE_KEY / VITE_CLERK_PUBLISHABLE_KEY

   - CLERK_SECRET_KEY

4. Determine whether Clerk was already selected and partially implemented by the previous development phase.

5. Do NOT replace Clerk with another authentication provider.

6. Do NOT create an authentication bypass.

7. Do NOT rewrite the authentication architecture.

8. Do NOT modify unrelated parts of the application.

If the project is already designed to use Clerk, continue using Clerk.

For now, create/update only the configuration template and documentation needed for the Clerk development environment.

Use placeholders such as:

VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx

CLERK_SECRET_KEY=sk_test_xxxxxxxxx

Do NOT require me to paste the actual secret into the conversation.

After inspecting the project, tell me exactly:

- Which Clerk packages are installed

- Which files use Clerk

- Which environment variables are expected

- Which authentication features are already implemented

- Which authentication features are missing

- Whether the current application can run without Clerk

- What exact configuration is required to continue

- Whether the project is currently blocked by missing Clerk credentials

Do not implement a bypass.

Do not proceed with unrelated development until this is clear.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/27882e9a-3638-4319-ab7c-3dc34fc3da1d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
