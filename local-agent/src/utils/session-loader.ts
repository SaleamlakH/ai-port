import fs from 'fs';
import os from 'os';
import path from 'path';

const SESSION_PATH = path.join(os.homedir(), '.aiport', 'session.json');

export const loadSession = () => {
  if (!fs.existsSync(SESSION_PATH)) {
    throw new Error('Not logged in. Run: aiport login');
  }

  const raw = fs.readFileSync(SESSION_PATH, 'utf-8');
  return JSON.parse(raw);
};

export const saveSession = (data: any) => {
  const dir = path.dirname(SESSION_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(SESSION_PATH, JSON.stringify(data, null, 2));
};
