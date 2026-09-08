# Contributing to CipherGround

Thank you for your interest in contributing! Here is how to get started.

## Getting Started

1. Fork the repository and clone it locally.
2. Follow the [Quick Start](README.md#-quick-start) in the README to set up your local environment.
3. Create a new branch for your feature or fix:
   ```sh
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

```sh
npm ci           # Install dependencies
npm run dev      # Start dev server
npm run typecheck  # Check types
npm run lint       # Lint code
npm test           # Run all tests
```

## Submitting Changes

1. Make sure `npm run typecheck`, `npm run lint`, and `npm test` all pass.
2. Write a clear, descriptive commit message.
3. Push your branch and open a Pull Request against `main`.
4. Describe what your PR does and why.

## Adding Challenges

- Place new challenge definitions in `challenges/`.
- Follow the existing evidence structure and include an organizer solution in `docs/SOLUTIONS.md`.
- Add reproducible evidence generation scripts where applicable.
- Vulnerable web labs go in `challenges/web/` and require a Dockerfile.

## Security Issues

Please **do not** open public GitHub issues for security vulnerabilities. Instead, contact the maintainer directly. See [`docs/SECURITY.md`](docs/SECURITY.md) for the security policy.

## Code Style

- TypeScript with strict mode enabled.
- Formatting: `npm run format` (oxfmt).
- Linting: `npm run lint` (oxlint).
- Keep components accessible — use Base UI / Shadcn primitives.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
