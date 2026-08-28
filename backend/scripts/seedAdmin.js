/**
 * Seeds (or updates) exactly one superadmin account, from environment
 * variables — never hardcoded in source. This is the ONLY way a
 * superadmin account gets created; there is no signup path or API
 * endpoint that can grant that role, so this script is the single
 * source of truth for "who can log into the Admin portal."
 *
 * Usage:
 *   1. Set these in backend/.env:
 *        ADMIN_EMAIL=you@yourcollege.edu
 *        ADMIN_PASSWORD=a-strong-password
 *        ADMIN_FIRST_NAME=Jane        (optional, defaults to "Admin")
 *        ADMIN_LAST_NAME=Doe          (optional, defaults to "User")
 *   2. Run:  npm run seed:admin
 *
 * Safe to re-run: if the account already exists it just resets the
 * password/name to whatever is currently in .env, it never creates a
 * second admin.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "\n✖ ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before running this script.\n"
    );
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("\n✖ ADMIN_PASSWORD should be at least 8 characters.\n");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (admin) {
    admin.password = ADMIN_PASSWORD; // pre-save hook re-hashes it
    admin.role = "superadmin";
    admin.firstName = process.env.ADMIN_FIRST_NAME || admin.firstName;
    admin.lastName = process.env.ADMIN_LAST_NAME || admin.lastName;
    await admin.save();
    console.log(`\n✓ Existing account promoted/reset as admin: ${admin.email}\n`);
  } else {
    admin = await User.create({
      firstName: process.env.ADMIN_FIRST_NAME || "Admin",
      lastName: process.env.ADMIN_LAST_NAME || "User",
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: "superadmin",
      branch: "Administration",
      year: 1,
      section: "-",
      rollNumber: "ADMIN-0001",
    });
    console.log(`\n✓ Admin account created: ${admin.email}\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
