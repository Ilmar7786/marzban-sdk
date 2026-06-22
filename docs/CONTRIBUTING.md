# 🤝 Contributing to MarzbanSDK

Thank you for considering contributing to **MarzbanSDK**! 🎉 We welcome all contributions, whether it's fixing bugs, adding new features, improving documentation, or suggesting ideas.

## 🛠 How to Contribute

### 📌 Reporting Issues

If you find a bug or have a feature request, please open an [issue](https://github.com/Ilmar7786/marzban-sdk/issues) and provide:

- A clear description of the problem.
- Steps to reproduce (if applicable).
- Expected vs. actual behavior.

### 🔀 Submitting a Pull Request (PR)

To submit changes, follow these steps:

1. **Fork** the repository.
2. **Create a new branch** (`feat/your-feature` or `fix/your-bug`).
3. **Make your changes** and ensure they follow the project's coding style.
4. **Run the test suite** with `npm test` and **build the project** with `npm run build` to ensure there are no errors.
5. **Commit with a meaningful message** (see below).
6. **Push to your fork** and open a PR against the `main` branch.

### 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/), enforced
automatically by **commitlint** via a Husky `commit-msg` hook:

```
type: short description

Optional longer description
```

**Examples:**

- `feat: add WebSocket support for logs`
- `fix: resolve token refresh issue`
- `docs: update README with installation guide`

Use `type!` or a `BREAKING CHANGE:` footer for breaking changes (drives the major
version bump in the automated release).

### 🔍 Code Guidelines

- Use **TypeScript** and ensure type safety.
- Follow **ESLint and Prettier** rules.
- Keep code **modular and readable**.

## 🛠 Setting Up Development Environment

1. Clone the repository:
   ```sh
   git clone https://github.com/Ilmar7786/marzban-sdk.git
   cd marzban-sdk
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the project to verify everything is working:
   ```sh
   npm run build
   ```

## ✅ Code Review & Merging

Before merging, ensure that:

- The code follows the project's style guide.
- The PR has been reviewed by at least one maintainer.

## 💬 Community & Discussion

If you have any questions or ideas, feel free to:

- Start a discussion in [GitHub Discussions](https://github.com/Ilmar7786/marzban-sdk/discussions).

🚀 **Thank you for contributing!** 🚀
