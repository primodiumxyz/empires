# Empires: Engine

The engine for Empires; meaning Phaser logic for creating and managing scenes, rendering chunks, and interacting with the game from user inputs.

## Setup

Follow the [README](../../README.md) in the root of the monorepo to install the necessary dependencies and configure the environment.

## Organization

This package is used as a library for the [web package](../../web).

```ml
src - "Source files
├── api - "Consumer-facing API for the engine"
└── lib - "Internal logic for the engine"
    ├── core - "Core Phaser logic for creating various components and classes"
    └── util - "Utilities and low-level logic"
```
