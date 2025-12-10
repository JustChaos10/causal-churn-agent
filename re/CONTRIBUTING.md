# Contributing to Re

Thank you for your interest in contributing to Re! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/re.git
   cd re
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build packages:**
   ```bash
   npm run build
   ```

## Development Workflow

### Project Structure

```
re/
├── packages/
│   ├── core/          # Core framework
│   ├── react-ui/      # React components
│   └── api/           # Backend API
├── examples/
│   └── demo/          # Demo app
```

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate package

3. **Test your changes:**
   ```bash
   npm run build
   npm run dev
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

### Commit Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Pull Requests

1. Push to your fork
2. Open a PR against `main`
3. Describe your changes
4. Wait for review

## Adding New Components

To add a new component to `@re/react-ui`:

1. **Add type definition** in `packages/core/src/types/components.ts`
2. **Create component** in `packages/react-ui/src/components/YourComponent.tsx`
3. **Add to renderer** in `packages/react-ui/src/renderer/ComponentRenderer.tsx`
4. **Add styles** in `packages/react-ui/src/styles/index.css`
5. **Export** from `packages/react-ui/src/components/index.ts`
6. **Update system prompt** in `packages/core/src/client/groq-client.ts`
7. **Document** in README

## Code Style

- Use TypeScript
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Testing

Before submitting:

1. Build all packages: `npm run build`
2. Test the demo app: `npm run dev`
3. Verify components render correctly
4. Test in both light and dark mode

## Questions?

Feel free to open an issue for discussion!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
