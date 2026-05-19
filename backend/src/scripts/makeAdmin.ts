/**
 * One-time script to grant admin privileges to a user by email.
 *
 * Usage:
 *   npx tsx src/scripts/makeAdmin.ts your@email.com
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email = process.argv[2];
if (!email) {
  console.error('❌  Usage: npx tsx src/scripts/makeAdmin.ts <email>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('✅  MongoDB connected');

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isAdmin: true } },
    { new: true }
  );

  if (!user) {
    console.error(`❌  No user found with email: ${email}`);
  } else {
    console.log(`✅  ${user.name} (${user.email}) is now an admin!`);
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
