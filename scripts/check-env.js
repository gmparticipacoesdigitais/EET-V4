#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const root = process.cwd()
const envFiles = ['.env.local', '.env', '.env.development']
for (const f of envFiles) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) dotenv.config({ path: p })
}

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]
const optional = [
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_DATABASE_URL',
]

const missing = required.filter((k) => !process.env[k])

console.log('— Firebase env check —')
console.log('Required: ', required.join(', '))
console.log('Optional: ', optional.join(', '))

if (missing.length) {
  console.log('\nMissing:', missing.join(', '))
  console.log('\nHow to find them:')
  console.log('- Firebase Console > Project Settings > Your apps > Web app')
  console.log('- Copy the config keys and paste into your .env as VITE_ variables')
  console.log("- Ensure 'localhost' is in Authorized domains (Authentication > Settings)")
  process.exitCode = 1
} else {
  console.log('\nAll required variables are set. ✅')
}

