import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining",      color: "#FF6B6B", icon: "🍔" },
  { name: "Transport",          color: "#4ECDC4", icon: "🚗" },
  { name: "Shopping",           color: "#45B7D1", icon: "🛍️" },
  { name: "Entertainment",      color: "#96CEB4", icon: "🎬" },
  { name: "Health & Fitness",   color: "#FFEAA7", icon: "💪" },
  { name: "Housing & Rent",     color: "#DDA0DD", icon: "🏠" },
  { name: "Utilities",          color: "#98D8C8", icon: "⚡" },
  { name: "Education",          color: "#F7DC6F", icon: "📚" },
  { name: "Travel",             color: "#85C1E9", icon: "✈️" },
  { name: "Salary",             color: "#7DDA2A", icon: "💰" },
  { name: "Freelance",          color: "#A8FF60", icon: "💻" },
  { name: "Investments",        color: "#52BE80", icon: "📈" },
];
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/crypto";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many authentication requests, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Apply rate limiting to authentication routes
router.use("/auth/register", authLimiter);
router.use("/auth/login", authLimiter);

// MOCK GOOGLE AUTH / LINK ROUTE FOR LOCAL & VERCEL DEMONSTRATIONS
router.post("/auth/google", async (req, res) => {
  const { credential, email, username, googleId } = req.body;
  if (!googleId || !email) {
    res.status(400).json({ error: "Missing Google login parameters" });
    return;
  }

  try {
    // Check if user exists by googleId
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId));

    if (!user) {
      // Check if user exists by username (to link or avoid name collision)
      const cleanUsername = (username || email.split("@")[0] || "google_user").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      let finalUsername = cleanUsername;
      let counter = 1;
      
      // Handle potential collisions
      while (true) {
        const [existing] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.username, finalUsername));
        if (!existing) break;
        finalUsername = `${cleanUsername}${counter}`;
        counter++;
      }

      [user] = await db
        .insert(usersTable)
        .values({
          username: finalUsername,
          email: email.toLowerCase().trim(),
          googleId,
        })
        .returning();
    }

    // Set signed session cookie
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
    console.error("Google Auth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
  if (!cookieUserId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const userId = parseInt(cookieUserId, 10);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

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
  if (!cookieUserId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const userId = parseInt(cookieUserId, 10);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Invalid session" });
    return;
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

export default router;
