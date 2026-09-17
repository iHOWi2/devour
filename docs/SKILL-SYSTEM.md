# Skill system

A **skill** is procedural knowledge: how to do a kind of work well. A **tool** is a
capability: what the agent can do. Skills never execute anything; tools never carry opinions.

The format below is vendor-neutral. It is inspired by the way open skill formats structure
progressive disclosure, but it is Devour's own and works with any model provider.

## Skill anatomy

```
skills/
|-- frontend-design/
|   |-- SKILL.md          required
|   |-- references/       deep material, loaded on demand
|   |-- examples/         concrete input/output pairs
|   `-- scripts/          executable helpers, run through tools
|-- android/
|   `-- SKILL.md
`-- debugging/
    `-- SKILL.md
```

`SKILL.md` starts with YAML frontmatter:

```markdown
---
name: frontend-design
description: >
  Guides visual and interaction design for mobile screens. Use when the task involves
  layout, typography, colour, spacing, motion or reviewing a screen's visual quality.
version: 0.1.0
license: MIT
tags: [ui, mobile, design]
requires: []
---

# Frontend design

Imperative instructions for doing the work...
```

| Field         | Required | Notes                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `name`        | yes      | lowercase, hyphenated, unique within its scope                                                    |
| `description` | yes      | third person, states what it does **and when to use it**; this is the only text always in context |
| `version`     | no       | semver                                                                                            |
| `license`     | no       | for redistributable skills                                                                        |
| `tags`        | no       | discovery hints                                                                                   |
| `requires`    | no       | other skill names that must load with it                                                          |

## Progressive disclosure

Three levels, loaded only as far as needed:

| Level | Content                                            | Budget                                                  |
| ----- | -------------------------------------------------- | ------------------------------------------------------- |
| 1     | `name` + `description` of every discovered skill   | ~100 words per skill, always present                    |
| 2     | the body of `SKILL.md` for activated skills        | under 5,000 words, 1,500-2,000 preferred                |
| 3     | files under `references/`, `examples/`, `scripts/` | unbounded, fetched by path when the body points at them |

The body must not duplicate its references; it points to them: "for the full type scale see
`references/type-scale.md`". Large references get a grep hint so the agent can search instead
of reading everything.

## Discovery and scopes

Skills are discovered from three scopes, highest precedence first:

| Scope     | Location                      | Meaning                                      |
| --------- | ----------------------------- | -------------------------------------------- |
| project   | `<project>/.devour/skills/`   | rules for this codebase, committed with it   |
| workspace | `<workspace>/.devour/skills/` | rules shared across the user's projects      |
| global    | app data directory            | user's personal skills, available everywhere |

A project skill with the same `name` as a global one replaces it. Discovery is a filesystem
scan plus frontmatter parse; malformed frontmatter makes a skill invisible and produces a
visible warning rather than a silent failure.

Skills may also come from Git: a skill source is a repository URL plus a subdirectory and a
ref. Pulling a skill source is a normal Git operation through the runtime, so it needs no
special machinery and is permission-checked like any other network action.

## Activation

Multiple skills are active at once - `frontend-design` + `react-native` + `android` +
`debugging` is the normal case. Activation is a ranking problem, not a concatenation problem:

1. match the task and workspace signals (file types, frameworks, the user's wording) against
   level 1 metadata;
2. activate the highest-scoring skills, plus everything in their `requires`;
3. load level 2 bodies until the context budget for skills is spent, highest score first;
4. keep level 3 out of context until a body asks for a specific path.

If two skills conflict, the narrower scope wins (project over workspace over global) and the
conflict is reported in the UI.

## Authoring rules

- One domain per skill. Overlapping triggers make ranking meaningless.
- Write the description in third person with concrete trigger phrases; write the body in
  imperative form.
- Prefer examples over prose for output formats.
- Scripts are invoked through the normal tool and permission path - a skill cannot execute
  anything by itself.
- A skill that is only a list of links is not a skill.

## Validation

A skill is valid when: `SKILL.md` exists and parses; `name` matches its directory; the
description says when to use it; the body stays under the level 2 budget; every referenced
path exists; no reference is duplicated inline in the body.

Phase 6 implements discovery, validation, ranking and loading. Devour ships with its own
skills (`frontend-design`, `android`, `debugging`) written in this format, and they are
ordinary directories - nothing about the system is specific to the skills we author.
