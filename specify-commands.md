# DIE MCP Server - Specify Commands

This document contains the `/specify` commands for implementing the three main features of the Design Intelligence Engine (DIE) MCP Server, based on the PRD.

---

## Feature 1: Fullständig Webbsideanalys

```
/specify Build a tool that analyzes any complete webpage and generates production-ready component code. Users provide a website URL and specify their preferred framework (React, Angular, Vue, or Svelte) and styling approach (Tailwind, CSS, SCSS, or styled-components). The system captures the entire page visually, extracts the design structure including colors, typography, layout patterns, and semantic HTML structure, then generates a complete, self-contained component that recreates the page design. The generated code must be ready to use immediately without placeholders, include all necessary imports and types, follow framework-specific best practices, be fully responsive with mobile-first design, and include accessibility features. The analysis must complete within 30 seconds for typical pages and work completely offline after initial setup.
```

---

## Feature 2: Specifik Komponentextraktion

```
/specify Build a tool that extracts and recreates individual components from any webpage. Users provide a website URL, identify the specific component they want either by CSS selector or by describing it semantically (like "navigation bar" or "pricing table"), and specify their target framework and styling preference. The system locates the component on the page, captures it visually in isolation, analyzes its design including interactive states like hover and focus effects, and generates standalone component code. When multiple matching components exist, the system presents all options for the user to choose from. When a component cannot be found, the system suggests similar elements that were detected. The generated component must be self-contained, production-ready, and include proper event handlers for any interactive elements.
```

---

## Feature 3: Multi-steg Flödesanalys

```
/specify Build a tool that analyzes complete user flows across multiple steps and generates all necessary components and state management code. Users define a starting URL and describe a sequence of actions (like clicking buttons, filling forms, scrolling, or waiting for elements) that represent a user journey such as registration, checkout, or search flows. The system executes each step automatically, capturing the visual state and DOM structure at each point, then analyzes how the interface changes throughout the flow. It generates separate components for each step of the flow, shared state management code to handle data passing between steps, and routing logic to navigate the flow. The output is structured with component code, state management patterns appropriate to the chosen framework, and integration instructions. This enables developers to quickly implement complex multi-step processes by analyzing existing implementations.
```

---

## Usage

To implement these features, run each `/specify` command in Claude Code. The system will:

1. Parse the feature description
2. Create a feature specification document
3. Identify any areas that need clarification
4. Generate functional requirements and user scenarios

After running `/specify`, you can proceed with:
- `/plan` - Create the implementation plan
- `/tasks` - Generate the task list
- `/implement` - Execute the implementation

---

**Note**: These commands focus on WHAT to build and WHY (user needs), not HOW (technical implementation). The technical details are defined in the PRD (`die_prd.md`) and will be addressed during the planning phase.
