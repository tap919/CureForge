# Deterministic Verification Agent Laboratory

This repository provides a **GPU-accelerated function verification laboratory**. It translates natural language intents into a strictly schema-constrained JSON Intermediate Representation (IR), compiles that IR into deterministic JavaScript, and safely evaluates it using a secure backend Node.js `vm` sandbox with Acorn AST verification, `fast-check` property fuzzing, and WebGPU-accelerated 3D Monte Carlo visualization.

## Core Architecture

The system operates strictly out of a server-side JSON IR and deterministic compilation flow to guarantee correctness and security.

1. **Schema-Constrained JSON IR**: User requests are synthesized by the `gemini-3.1-pro-preview` model into a strictly defined JSON Intermediate Representation.
2. **Deterministic IR-to-JS Compilation**: The JSON IR is deterministically compiled into executable JavaScript.
3. **Backend Verification with Acorn & VM**: The resulting JS is analyzed structurally using Acorn to prevent unsafe operations, then executed within a secure Node.js `vm` sandbox.
4. **Property-Based Fuzzing**: Integrates `fast-check` inside the sandbox to deterministically fuzz invariant properties against the synthesized AST.
5. **Monte Carlo Simulations & 3D WebGPU Analysis**: Thousands of inputs are simulated deterministically to probe execution boundaries, then rendered visually in-browser using `@react-three/fiber`.

## Public Contract

The public API forms a consistent contract:

### 1. Synthesis Input (JSON IR)
```json
{
  "task_id": "string",
  "intent": "string",
  "schema_version": "1.0",
  "properties": ["output must be a number"],
  "variables": {},
  "steps": [ ... ]
}
```

### 2. Verification Input
```json
{
  "code": "...",
  "spec": "...",
  "runMonteCarlo": true,
  "runFuzzing": true
}
```

## Getting Started

1. Set up the `.env` using `.env.example`
2. Run `npm install`
3. Run `npm run dev` to boot the backend and frontend simultaneously

## Testing

The test suite validates the current JavaScript-centric architecture:
- **Synthesis generation**: valid JSON IR emission.
- **Verification**: `vm` sandboxing evaluation and Acorn syntax verification.
- **Deterministic replay**: Fuzz tests and execution yields perfectly reproducible traces.

