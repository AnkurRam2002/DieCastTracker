# LLM Agent Rules and Configuration

This file contains the core operational guidelines and rules that any LLM agent or AI assistant must strictly follow when working on the `DieCastTracker` repository.

## 1. Issue Management Workflow
- **Always Create Issues:** Before starting work on any new feature, bug fix, or significant refactor, the LLM must first create a GitHub issue using the `gh` CLI. The issue should have a clear title and description of the planned work.
- **Link Commits:** Commit messages must reference the issue number (e.g., `Fixes #123` or `Closes #123`) so the issue is automatically closed or linked upon merging.
- **Close Issues:** If the commit does not automatically close the issue, the LLM should use the `gh` CLI to close it manually and leave a comment explaining the resolution.

## 2. Testing and Verification
- **Test Before Pushing:** Code must be verified locally before it is pushed. Depending on the changes, this means ensuring there are no syntax errors, linting errors, or breaking changes in the frontend/backend. 
- **No Blind Pushes:** Pushing untested or broken code is strictly prohibited. If an automated test suite exists, run it. Otherwise, perform a basic build check or review the logic.

## 3. Code Standards
- **Tech Stack:** Stick to the existing tech stack (React, Vite, Tailwind CSS v4, Node.js, Express, MongoDB).
- **Styling:** Adhere strictly to the existing aesthetic (glassmorphism, vibrant colors, dark themes, Tailwind CSS classes). Do not introduce basic unstyled components unless requested.
- **Documentation:** Ensure docstrings and existing comments are preserved. Add minimal, clear comments for complex logic.

## 4. Environment & Tools
- **Tool Selection:** Always use the most specific IDE or CLI tools available (e.g., use dedicated file editors over generic terminal echo/cat commands).
- **Safety First:** If a command or operation could result in data loss (e.g., dropping a database collection), the LLM must pause and ask the user for explicit confirmation before proceeding.

## 5. Communication
- Keep responses concise and focused on the technical tasks.
- Provide clear summaries after completing a workflow (e.g., "Created issue, wrote code, pushed branch, closed issue").
