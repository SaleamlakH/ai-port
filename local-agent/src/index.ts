#!/usr/bin/env node

/**
 * Aiport Local Agent — Entry Point
 *
 * PURPOSE:
 * Minimal CLI interface for validating core Unit 1 capabilities:
 * - project structure generation
 * - AST extraction (JS/TS only in V1)
 *
 * IMPORTANT:
 * This file is temporary runtime scaffolding.
 * It will later be replaced by SSE bridge entry flow.
 */

import { Command } from 'commander';
import { loadConfig } from './modules/config/loader.js';
import { loadSession, saveSession } from './utils/session-loader.js';
import { createBridgeClient } from './modules/bridge/client.js';

// load config file
const config = loadConfig();

// create bridge
const wsBridge = createBridgeClient(config);

// create command
const program = new Command();

program.name('aiport').description('CLI to aiport local agent').version('1.0.0');

program
  .command('register')
  .description('Register developer using email and password')
  .argument('<email>', 'valid email address')
  .argument('<password>', '8 or more char length password')
  .action(async (email: string, password: string) => {
    try {
      const res = await fetch(`${config.mcpServerUrl}/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.error('Registration failed');
        process.exit(1);
      }

      const { data } = await res.json();

      saveSession({ accessToken: data.token });

      console.log('Registered successfully');
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

program
  .command('login')
  .description('Login to aiport using email and password')
  .argument('<email>', 'registered email address')
  .argument('<password>', '8 or more char length password')
  .action(async (email: string, password: string) => {
    try {
      const res = await fetch(`${config.mcpServerUrl}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.error('Login failed');
        process.exit(1);
      }

      const { data } = await res.json();

      saveSession({ accessToken: data.token });

      console.log('Logged in successfully');
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

program
  .command('key')
  .description('Manage API keys')
  .option('-c, --create <label>', 'create new API key')
  .option('-r, --revoke <apiKey>', 'revoke API key')
  .action(async (options) => {
    if ((options.create && options.revoke) || (!options.create && !options.revoke)) {
      console.error('Provide exactly one of --create or --revoke');
      process.exit(1);
    }

    const session = loadSession();
    const token = session.accessToken;

    try {
      if (options.create) {
        const res = await fetch(`${config.mcpServerUrl}/apiKey`, {
          method: 'POST',
          body: JSON.stringify({ label: options.create }),
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          console.error("Can't create API key");
          process.exit(1);
        }

        const { data } = await res.json();
        console.log('New API key:', data.apiKey);
      }

      if (options.revoke) {
        const res = await fetch(`${config.mcpServerUrl}/apiKey`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-api-key': options.revoke,
          },
        });

        if (!res.ok) {
          console.error('Can not create API key');
          process.exit(1);
        }

        console.log('API key revoked');
      }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

program
  .command('connect')
  .description('Connect to the webserver')
  .action(async () => {
    const session = loadSession();
    const token = session.accessToken;

    wsBridge.connect(token);
  });

try {
  program.parse();
} catch (error) {
  console.error(error);
  process.exit(1);
}
