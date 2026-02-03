# Agents & Skills

This document outlines the available specialized agents (skills) that can be invoked to assist with development tasks. Each agent is an expert in a specific domain.

## General Guidelines

1.  **Be Specific**: When making a request, clearly state your goal and which part of the codebase you're working on.
2.  **Suggest an Agent**: If you know which agent is best for the task, you can suggest using it (e.g., "Using `zod-expert`, add validation to this schema"). The main agent will delegate tasks appropriately.
3.  **Review Changes**: Agents will propose code changes. Always review them before accepting.

---

## Available Agents

Here is a list of the available agents and their expertise.

### 1. `jotai-expert`
-   **Expertise**: Expert guidance for Jotai state management in React applications. Provides best practices, performance optimization, and architectural patterns.
-   **When to use**: When designing atom structures, implementing state management, optimizing re-renders, handling async state, or reviewing Jotai code.

### 2. `react-architect-skills`
-   **Expertise**: Provides guidelines for React and TanStack Router folder structure and feature-module architecture.
-   **When to use**: When writing, reviewing, or refactoring React code for structure, naming, colocation, encapsulation, and layer separation.

### 3. `react-hook-form`
-   **Expertise**: React Hook Form performance optimization for client-side form validation using `useForm`, `useWatch`, `useController`, and `useFieldArray`.
-   **When to use**: When building client-side controlled forms with the React Hook Form library.

### 4. `tanstack-query`
-   **Expertise**: Helps manage server state in React with TanStack Query v5. Covers `useMutationState`, optimistic updates, `throwOnError`, network mode, and `infiniteQueryOptions`.
-   **When to use**: When setting up data fetching, fixing v4→v5 migration errors, or debugging SSR/hydration issues.

### 5. `tanstack-router`
-   **Expertise**: Build type-safe, file-based React routing with TanStack Router. Supports client-side navigation, route loaders, and TanStack Query integration.
-   **When to use**: When implementing file-based routing patterns, building SPAs with TypeScript routing, or troubleshooting router-related issues.

### 6. `vercel-react-only-best-practices`
-   **Expertise**: React performance optimization guidelines from Vercel Engineering.
-   **When to use**: When writing, reviewing, or refactoring React code to ensure optimal performance patterns.

### 7. `zod`
-   **Expertise**: Zod schema validation best practices for type safety, parsing, and error handling.
-   **When to use**: When defining `z.object` schemas, using `z.string` validations, `safeParse`, or `z.infer`.
