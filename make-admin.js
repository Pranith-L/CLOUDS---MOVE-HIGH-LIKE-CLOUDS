import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';

dotenv.config({ path: './server/.env' });

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address. Example: node make-admin.js admin@example.com');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    user.role = 'admin';
    await user.save();
    
    console.log(`Success! User ${email} is now an admin.`);
    console.log(`Log out and log back in on the website to see the Admin Panel link.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
  });
