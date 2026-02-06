# CLAUDE.md - AI Assistant Development Guide

> **Last Updated:** 2026-01-04
> **Repository:** florycarm-a11y/Claude
> **Purpose:** Guide for AI assistants working on this codebase

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Codebase Structure](#codebase-structure)
3. [Development Workflows](#development-workflows)
4. [Git Conventions](#git-conventions)
5. [Code Standards](#code-standards)
6. [Key Principles for AI Assistants](#key-principles-for-ai-assistants)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Repository Overview

### Project Status
- **Current State:** Early stage / Initial setup
- **Primary Language:** TBD
- **Framework:** TBD
- **Package Manager:** TBD

### Repository Information
- **Remote:** http://127.0.0.1:30555/git/florycarm-a11y/Claude
- **Current Branch:** claude/add-claude-documentation-H2R0S
- **Main Branch:** TBD (to be established)

### Purpose
This repository is currently in its initial setup phase. This document will evolve as the codebase grows and will serve as the primary reference for AI assistants contributing to the project.

---

## Codebase Structure

### Current Structure
```
/home/user/Claude/
├── .git/              # Git repository data
├── README.md          # Project README
└── CLAUDE.md          # This file - AI assistant guide
```

### Planned Structure
*To be updated as the project evolves*

---

## Development Workflows

### Branch Naming Convention
All AI assistant work should be done on feature branches following this pattern:
```
claude/<description>-<session-id>
```

**Example:** `claude/add-claude-documentation-H2R0S`

### Standard Development Flow

1. **Branch Creation**
   ```bash
   git checkout -b claude/<feature-name>-<session-id>
   ```

2. **Development**
   - Make incremental changes
   - Test frequently
   - Commit logically related changes together

3. **Commit**
   ```bash
   git add <files>
   git commit -m "Clear, descriptive message"
   ```

4. **Push**
   ```bash
   git push -u origin claude/<branch-name>
   ```
   - **CRITICAL:** Branch must start with 'claude/' and match session ID
   - Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors

5. **Pull Request**
   - Create PR with clear description
   - Include summary of changes
   - Add test plan when applicable

---

## Git Conventions

### Commit Messages

Follow this format:
```
<type>: <subject>

<body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without feature changes
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**
```
feat: Add user authentication system

Implements JWT-based authentication with refresh tokens.
Includes login, logout, and token refresh endpoints.

fix: Resolve race condition in data loading

Adds proper synchronization to prevent concurrent access
issues when loading configuration data.

docs: Update CLAUDE.md with git conventions
```

### Branch Management

- **Feature Branches:** `claude/<feature>-<session-id>`
- **Always push to designated branch:** Never push to different branches without permission
- **Clean history:** Prefer meaningful commits over WIP commits

### Git Safety Protocol

**NEVER:**
- Update git config without permission
- Run destructive commands (force push, hard reset) without explicit user request
- Skip hooks (--no-verify, --no-gpg-sign) without permission
- Force push to main/master branches
- Commit files with secrets (.env, credentials.json, etc.)

**ALWAYS:**
- Check authorship before amending: `git log -1 --format='%an %ae'`
- Verify branch before pushing
- Use retry logic for network failures

---

## Code Standards

### General Principles

1. **Keep It Simple**
   - Avoid over-engineering
   - Only make requested or clearly necessary changes
   - Don't add features beyond the scope

2. **Security First**
   - No command injection vulnerabilities
   - No XSS vulnerabilities
   - No SQL injection vulnerabilities
   - Follow OWASP Top 10 guidelines

3. **Read Before Modifying**
   - NEVER propose changes to unread code
   - Understand existing patterns before modifying
   - Follow established conventions

4. **Minimize Changes**
   - Bug fixes don't need surrounding refactoring
   - Don't add unnecessary error handling
   - Avoid premature abstractions
   - Three similar lines > premature abstraction

### Code Patterns

*To be established as codebase grows*

### Testing Requirements

*To be established as testing framework is added*

---

## Key Principles for AI Assistants

### Task Management

1. **Use TodoWrite Tool**
   - Plan complex tasks (3+ steps)
   - Track progress for non-trivial work
   - Update status in real-time
   - Mark tasks complete immediately after finishing

2. **Task States**
   - `pending`: Not started
   - `in_progress`: Currently working (ONLY ONE at a time)
   - `completed`: Successfully finished

3. **When to Use Todo List**
   - Complex multi-step tasks
   - Non-trivial implementations
   - User provides multiple tasks
   - Tasks requiring careful planning

4. **When NOT to Use Todo List**
   - Single straightforward tasks
   - Trivial operations
   - Purely informational requests

### Tool Usage

1. **Prefer Specialized Tools**
   - Use `Read` instead of `cat`
   - Use `Edit` instead of `sed/awk`
   - Use `Write` instead of `echo >`
   - Use `Grep` instead of `grep` command
   - Use `Glob` instead of `find` or `ls`

2. **Parallel Execution**
   - Run independent commands in parallel
   - Use single message with multiple tool calls
   - Chain dependent commands with `&&`

3. **Exploration**
   - Use Task tool with `subagent_type=Explore` for codebase exploration
   - Don't search directly for open-ended queries
   - Use specialized agents for complex searches

### Communication Style

1. **Be Concise**
   - Short, clear responses
   - No unnecessary emojis (unless requested)
   - Use GitHub-flavored markdown
   - Output text directly, not through bash echo

2. **Code References**
   - Use format: `file_path:line_number`
   - Example: "Error handling in src/services/process.ts:712"

3. **Professional Objectivity**
   - Prioritize technical accuracy
   - Focus on facts and problem-solving
   - Disagree when necessary
   - Avoid excessive praise or validation

### File Operations

1. **ALWAYS Prefer Editing**
   - Edit existing files instead of creating new ones
   - Don't create documentation unless explicitly requested
   - Never create unnecessary files

2. **Read First**
   - Read files before editing
   - Understand context before changes
   - Preserve existing patterns

---

## Common Tasks

### Starting New Work

```bash
# 1. Ensure you're on the right branch
git status

# 2. Pull latest changes (if needed)
git fetch origin <branch-name>
git pull origin <branch-name>

# 3. Create feature branch (if needed)
git checkout -b claude/<feature>-<session-id>
```

### Making Changes

1. Read relevant files first
2. Create todo list for complex tasks
3. Make incremental changes
4. Test after each significant change
5. Commit with clear messages

### Committing Work

```bash
# 1. Check status
git status

# 2. Review changes
git diff

# 3. Stage changes
git add <files>

# 4. Commit with clear message
git commit -m "$(cat <<'EOF'
feat: Add new feature

Detailed description of changes and why they were made.
EOF
)"
```

### Pushing Changes

```bash
# Push with upstream tracking
git push -u origin claude/<branch-name>-<session-id>

# Verify push succeeded
git status
```

### Creating Pull Requests

```bash
# 1. Ensure branch is pushed
git push -u origin <branch-name>

# 2. Create PR using gh CLI
gh pr create --title "Clear PR title" --body "$(cat <<'EOF'
## Summary
- Bullet point summary of changes
- Key modifications
- New features or fixes

## Test Plan
- [ ] Steps to test
- [ ] Verification checklist
EOF
)"
```

---

## Troubleshooting

### Push Failures

**403 Error:**
- Verify branch name starts with `claude/`
- Verify branch name ends with correct session ID
- Check branch name matches expected pattern

**Network Errors:**
- Retry up to 4 times with exponential backoff
- Wait: 2s, 4s, 8s, 16s between attempts

### Common Issues

*To be populated as common issues are identified*

### Getting Help

- Use `/help` for Claude Code assistance
- Report issues: https://github.com/anthropics/claude-code/issues
- Check this document for established conventions

---

## Development Notes

### Current Focus
- Establishing repository structure
- Setting up development conventions
- Creating foundational documentation

### Next Steps
*To be updated as project evolves*

### Important Reminders

1. **Always develop on designated branch**
2. **Never push to different branches without permission**
3. **Create branches locally if they don't exist**
4. **Follow git safety protocols**
5. **Use appropriate tools for each task**
6. **Keep changes focused and minimal**
7. **Test before committing**
8. **Document as you go**

---

## Changelog

### 2026-01-04
- Initial CLAUDE.md creation
- Established basic conventions
- Documented git workflows
- Added AI assistant guidelines

---

## Meta Information

This document is designed to:
- Guide AI assistants working on this codebase
- Establish consistent development practices
- Document project-specific conventions
- Evolve with the project

**Update this document whenever:**
- Project structure changes significantly
- New conventions are established
- Common issues are identified
- Development workflows evolve

---

*This is a living document. Keep it updated and accurate.*
