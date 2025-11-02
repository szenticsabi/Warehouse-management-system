import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Ensure a JWT secret is configured before auth work
const ensureJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
};

//  Normalize emails to avoid missmatch during lookup
const normalizeEmail = (raw) =>
  String(raw || "").toLowerCase().trim();

/**
 * POST /api/auth/login
 * body: { email, password }
 * Validates input, Looks up user by email, verifies password, JWT for 2 days, returns public user fields
 */
const login = async (req, res) => {
  try {
    ensureJwtSecret();

    // Basic validation
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // Verify password hash
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 4) Sign JWT for 2 days
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    // 5) Send response, public user info
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shift: user.shift,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/auth/logout
 * Client stores token, server responds
 */
const logout = async (_req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error("logout error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * Extract "Bearer <token>" from header and returns the token string or null if missing/invalid.
 */
function getTokenFromHeader(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

/**
 * Authentication middleware
 * Verifies JWT, set req.user id and role, error if invalid
 */
const requireAuth = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ success: false, message: "Server misconfigured" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { id, role, iat, exp }
    req.user = { id: payload.id, role: (payload.role || "").toLowerCase() };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * Authorization middleware
 * requireRole "admin" or "employee", checks role against allowed list, error if role not allowed
 */
const requireRole = (...allowed) => {
  const allow = allowed.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }
    const role = (req.user.role || "").toLowerCase();
    if (!allow.includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

export { login, logout, requireAuth, requireRole };
