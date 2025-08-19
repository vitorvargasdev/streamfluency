# OpenFluency Agent Guidelines

## Project Description

OpenFluency is a browser extension for language learning through video content. It provides dual-language subtitles, vocabulary tracking, and translation features for platforms like YouTube. The extension allows users to learn languages by watching videos with customizable subtitle displays, text selection for instant translations/definitions, and vocabulary management.

## Build & Development Commands

- `pnpm install` - Install dependencies (use pnpm, not npm)
- `pnpm run dev` - Start development server
- `pnpm run build` - Type check with vue-tsc then build (will fail on type errors)
- `pnpm run preview` - Preview production build

## Code Style & Conventions

- **Formatting**: 2 spaces, no semicolons, single quotes, trailing comma ES5 (Prettier enforced)
- **TypeScript**: Strict mode enabled, use ESNext target, module resolution Bundler
- **Imports**: Use `@/` alias for src/ imports (e.g., `@/app/services/...`)
- **Vue**: Composition API with `<script setup>` preferred, .vue extension for components
- **Services**: Interface-driven design with adapters/factories pattern (see subtitle/player services)
- **Stores**: Pinia stores with typed state interfaces in separate types.ts files
- **Naming**: PascalCase for classes/interfaces, camelCase for files/variables/functions
- **Interfaces**: Prefix with 'I' (e.g., ISubtitleAdapter, IPlayerAdapter)
- **Constants**: UPPER_SNAKE_CASE for enums and global constants
- **Error Handling**: Define custom error types when needed (see subtitle/types/errors.ts)
- **File Organization**: Group by feature (services/, stores/, components/) with index.ts exports
