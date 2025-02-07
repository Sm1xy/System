# 42er-System

A easy to host feature-rich Discord bot built with Discord.js and MongoDB, offering moderation, giveaways,leveling system and more.

## Features

- **Moderation Commands**
  - Ban
  - Kick
  - Mute/Unmute
  - Role management

- **Voice System**
  - Create temporary voice channels
  ### WORK IN PROGRESS
  - _Voice channel management_
  - _Custom voice channel names_
  - _User limit controls_

- **Roleplay System**
  - Character creation and management
  - Dice rolling and random events
  - Inventory system
  - Character stats tracking

- **Ticket System**
  - Create support tickets
  - Ticket categories
  - Auto-assignment to staff
  - Ticket logging and archives

- **Giveaway System**
  - Create giveaways with custom duration and prizes
  - End giveaways manually
  - Customizable embed colors and images

- **Leveling System**
  - User progression tracking
  - Auto-role assignment at level milestones
  - Top users leaderboard

## Prerequisites

- Node.js 20.x
- MongoDB database
- Discord Bot Token

## Setup

1. Clone the repository
2. Copy `.template.env` to `.env` and fill in your credentials:
   - Discord bot token
   - MongoDB connection details
   - Server IDs and role IDs

3. Install dependencies:
```sh
npm install
```

4. Start the bot

```sh
# Development
npm run dev

# Production
npm run prod
```

## Docker Container

To start the bot in a docker container use

```sh
docker compose up -d
```

Standart Docker Container Name:
42er-system

## License
This Project is licensed under a MIT License to see more details have a look at the [LICENSE](LICENSE)


### Discord(s) the bot is used in

[42er Unity](https://discord.gg/JRjYJPaZjN)
