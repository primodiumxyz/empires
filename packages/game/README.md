# Empires: Game

The game objects and scenes for Empires. This includes all of the Phaser classes for various objects, as well as their associated rendering systems for initialization and update, as well as setting up user inputs. This package also contains the game initialization logic, which will return the global API for the game.

## Setup

Follow the [README](../../README.md) in the root of the monorepo to install the necessary dependencies and configure the environment.

## Organization

This package is used as a library for the [web package](../../web).

```ml
(* ./src *)
api - "Consumer-facing API for the game"
lib - "Internal logic for the engine"
├── config - "Configuration of the various scenes"
├── constants - "Game constants and keybindings"
├── objects - "Game objects"
├── tables - "Additional reactive tables for internal state"
└── utils - "Various utilities"
scenes - "Phaser scenes; each including initialization, user-input setup, rendering and systems"
├── common - "Camera and miscellaneous"
├── main - "Systems for main game logic"
├── root - "Root scene (game mode, effects)"
└── ui - "UI systems (notifications, invites)"
```
