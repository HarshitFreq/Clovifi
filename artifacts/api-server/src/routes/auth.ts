import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, categoriesTable, accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining",      color: "#FF6B6B", icon: "utensils" },
  { name: "Transport",          color: "#4ECDC4", icon: "car" },
  { name: "Shopping",           color: "#45B7D1", icon: "shopping-bag" },
  { name: "Entertainment",      color: "#96CEB4", icon: "film" },
  { name: "Health & Fitness",   color: "#FFEAA7", icon: "activity" },
  { name: "Housing & Rent",     color: "#DDA0DD", icon: "home" },
  { name: "Utilities",          color: "#98D8C8", icon: "zap" },
  { name: "Education",          color: "#F7DC6F", icon: "graduation-cap" },
  { name: "Travel",             color: "#85C1E9", icon: "plane" },
  { name: "Salary",             color: "#7DDA2A", icon: "wallet" },
  { name: "Freelance",          color: "#A8FF60", icon: "briefcase" },
  { name: "Investments",        color: "#52BE80", icon: "trending-up" },
];
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/crypto";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration inputs. Username min 3 chars, password min 6 chars." });
    return;
  }
  const { username, password } = parsed.data;
  const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  if (sanitizedUsername.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters and contain only letters and numbers." });
    return;
  }

  // Strong password complexity check: min 8 chars, 1 uppercase, 1 digit, 1 special char
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    res.status(400).json({
      error: "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character."
    });
    return;
  }

  try {
    // Check if username exists
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, sanitizedUsername));
    if (existing) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({
        username: sanitizedUsername,
        passwordHash,
      })
      .returning();

    // Seed default categories for the new user
    await db.insert(categoriesTable).values(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id }))
    );

    // Seed a default Cash Wallet account
    await db.insert(accountsTable).values({
      userId: user.id,
      name: "Cash Wallet",
      type: "checking",
      balance: "0",
      currency: "INR",
      color: "#7DDA2A",
      icon: "banknote",
    });

    // Set signed cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("userId", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid login inputs" });
    return;
  }
  const { username, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username.toLowerCase().trim()));

    let isMatch = false;
    if (user && user.passwordHash) {
      isMatch = verifyPassword(password, user.passwordHash);
    } else {
      // Timing attack mitigation: run fake verification to occupy CPU time matching standard hash checks
      verifyPassword(password, "$2b$10$invalidhashplaceholderthatlooksrealforequaltime");
    }

    if (!user || !isMatch) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Set signed cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("userId", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  res.clearCookie("userId");
  res.status(200).json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get("/auth/me", async (req, res) => {
  const cookieUserId = req.signedCookies?.userId;
  let userId = cookieUserId ? parseInt(cookieUserId, 10) : 1;
  if (isNaN(userId) || userId <= 0) {
    userId = 1;
  }

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    // Fallback if user with id wasn't found: get first user or create demouser
    if (!user) {
      const allUsers = await db.select().from(usersTable).limit(1);
      if (allUsers.length > 0) {
        user = allUsers[0];
      } else {
        const [newUser] = await db
          .insert(usersTable)
          .values({
            username: "demouser",
            passwordHash: hashPassword("DemoPass123!"),
          })
          .returning();
        user = newUser;
      }
    }

    // Set signed cookie for smooth persistence
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("userId", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /auth/profile
router.put("/auth/profile", async (req, res) => {
  const cookieUserId = req.signedCookies?.userId;
  let userId = cookieUserId ? parseInt(cookieUserId, 10) : 1;
  if (isNaN(userId) || userId <= 0) {
    userId = 1;
  }

  const { username, password } = req.body;
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const sanitized = username.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  if (sanitized.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters and contain only letters and numbers." });
    return;
  }

  try {
    // Check if new username is already taken by a different user
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, sanitized));
    if (existing && existing.id !== userId) {
      res.status(400).json({ error: "Username is already taken" });
      return;
    }

    const updates: Record<string, any> = { username: sanitized };
    if (password && password.trim().length >= 6) {
      updates.passwordHash = hashPassword(password);
    } else if (password && password.trim().length > 0) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      createdAt: updatedUser.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/firebase-sync — link or create user session from Firebase Authentication
router.post("/auth/firebase-sync", async (req, res) => {
  const { uid, email, displayName } = req.body;
  if (!uid) {
    res.status(400).json({ error: "Missing Firebase UID" });
    return;
  }

  try {
    const candidateName = (displayName || (email ? email.split("@")[0] : "") || `user_${uid.slice(0, 6)}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) || `user${uid.slice(0, 4)}`;

    // Try finding existing user by candidate name
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, candidateName));

    if (!user) {
      // Create a new user for this Firebase login
      const [created] = await db
        .insert(usersTable)
        .values({
          username: candidateName,
          passwordHash: hashPassword(uid),
        })
        .returning();
      user = created;

      // Seed default categories
      await db.insert(categoriesTable).values(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id }))
      );

      // Seed default checking account
      await db.insert(accountsTable).values({
        userId: user.id,
        name: "Main Checking",
        type: "checking",
        balance: "1000.00",
        currency: "INR",
        color: "#22c55e",
        icon: "landmark",
      });
    }

    // Set signed cookie for persistent backend session
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("userId", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      firebaseUid: uid,
    });
  } catch (err) {
    console.error("Firebase sync error:", err);
    res.status(500).json({ error: "Failed to sync Firebase user session" });
  }
});

export default router;
