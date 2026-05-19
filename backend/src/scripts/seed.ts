import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import connectDB from '../config/db.js';

dotenv.config();

// ─── Domain map (same as the frontend) ────────────────────────────────────────
const COMPANY_DOMAINS: Record<string, string> = {
  Microsoft:  'microsoft.com',
  Meta:       'meta.com',
  Google:     'google.com',
  Amazon:     'amazon.com',
  Apple:      'apple.com',
  Netflix:    'netflix.com',
  Adobe:      'adobe.com',
  LinkedIn:   'linkedin.com',
  Uber:       'uber.com',
  Airbnb:     'airbnb.com',
  Twitter:    'twitter.com',
  Salesforce: 'salesforce.com',
  Oracle:     'oracle.com',
  Nvidia:     'nvidia.com',
  Atlassian:  'atlassian.com',
  PayPal:     'paypal.com',
  TikTok:     'tiktok.com',
  Bloomberg:  'bloomberg.com',
  AMD:        'amd.com',
  Intel:      'intel.com',
  IBM:        'ibm.com',
  Samsung:    'samsung.com',
  Goldman:    'goldmansachs.com',
  Spotify:    'spotify.com',
  Snapchat:   'snapchat.com',
  Pinterest:  'pinterest.com',
  Dropbox:    'dropbox.com',
  Stripe:     'stripe.com',
  Shopify:    'shopify.com',
  Zoom:       'zoom.us',
  Lyft:       'lyft.com',
  Walmart:    'walmart.com',
};

function getLogoUrl(companyName: string): string {
  const domain = COMPANY_DOMAINS[companyName]
    ?? companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// ─── CLI argument parsing ──────────────────────────────────────────────────────
// Usage:
//   npx tsx src/scripts/seed.ts <CompanyName>
//   npx tsx src/scripts/seed.ts <CompanyName> --csv path/to/file.csv
//
// Examples:
//   npx tsx src/scripts/seed.ts Microsoft
//   npx tsx src/scripts/seed.ts Google --csv "5. All.csv"

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              📦  TheLeetCompany Seeder                   ║
╠══════════════════════════════════════════════════════════╣
║  Usage:                                                  ║
║    npx tsx src/scripts/seed.ts <CompanyName>             ║
║    npx tsx src/scripts/seed.ts <CompanyName> --csv file  ║
║                                                          ║
║  Examples:                                               ║
║    npx tsx src/scripts/seed.ts Microsoft                 ║
║    npx tsx src/scripts/seed.ts Google --csv 5.\ All.csv  ║
╚══════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const TARGET_COMPANY = args[0];

// Find --csv flag
const csvFlagIndex = args.findIndex(a => a === '--csv');
const csvFileName  = csvFlagIndex !== -1 && args[csvFlagIndex + 1]
  ? args[csvFlagIndex + 1]
  : 'questions.csv';

const LOCAL_CSV_PATH = path.isAbsolute(csvFileName)
  ? csvFileName
  : path.join(process.cwd(), csvFileName);

const LOGO_URL = getLogoUrl(TARGET_COMPANY);

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log(`\n🏢  Company   : ${TARGET_COMPANY}`);
    console.log(`🖼  Logo URL  : ${LOGO_URL}`);
    console.log(`📄  CSV file  : ${LOCAL_CSV_PATH}\n`);

    if (!fs.existsSync(LOCAL_CSV_PATH)) {
      console.error(`❌ File not found: ${LOCAL_CSV_PATH}`);
      process.exit(1);
    }

    const questionsMap = new Map<string, any>();

    fs.createReadStream(LOCAL_CSV_PATH)
      .pipe(csv())
      .on('data', (row: any) => {
        const title          = row.Title?.trim();
        const rawDifficulty  = row.Difficulty?.trim() ?? '';
        const frequency      = Number(row.Frequency);
        const acceptanceRate = Number(row['Acceptance Rate']);
        const link           = row.Link?.trim();
        const rawTopics      = row.Topics ?? '';
        const topicArray     = rawTopics ? rawTopics.split(',').map((t: string) => t.trim()) : [];

        const difficulty = ['Easy', 'Medium', 'Hard'].includes(
          rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase()
        )
          ? rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase()
          : 'Medium';

        if (!title) return;

        if (questionsMap.has(title)) {
          const existing = questionsMap.get(title);
          if (!existing.companies.includes(TARGET_COMPANY)) {
            existing.companies.push(TARGET_COMPANY);
          }
        } else {
          questionsMap.set(title, {
            companies:    [TARGET_COMPANY],
            logo:         LOGO_URL,
            title,
            difficulty,
            frequency:    isNaN(frequency)      ? 0 : frequency,
            acceptanceRate: isNaN(acceptanceRate) ? 0 : acceptanceRate,
            link,
            topic:        topicArray,
            isPremium:    false,
          });
        }
      })
      .on('end', async () => {
        const questionsToInsert = Array.from(questionsMap.values());
        console.log(`Parsed ${questionsToInsert.length} unique questions — upserting into MongoDB...`);

        for (const q of questionsToInsert) {
          await Question.findOneAndUpdate(
            { title: q.title },
            {
              $addToSet: { companies: { $each: q.companies } },
              $set: {
                logo:          q.logo,
                difficulty:    q.difficulty,
                frequency:     q.frequency,
                acceptanceRate: q.acceptanceRate,
                link:          q.link,
                topic:         q.topic,
              },
            },
            { upsert: true, new: true }
          );
        }

        console.log(`\n✅ Seeded ${questionsToInsert.length} questions for ${TARGET_COMPANY}!`);
        process.exit(0);
      })
      .on('error', (error: any) => {
        console.error('❌ CSV parse error:', error);
        process.exit(1);
      });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
