import bcrypt from "bcrypt";
import User from "../models/User.js";

/** GET /api/user/list
 * Return users, newest first
*/
const listUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .select("_id name email role shift createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** POST /api/user/add
 * Create user after validation, enforces unique email and hash password
 * body: { name, email, password, role?, shift? }
*/
const addUser = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").toLowerCase().trim();
    const password = req.body.password || "";
    const role = req.body.role || "employee";
    const shift = req.body.shift || "morning";

    // Required name, email, password
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    // Unique email
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Hash and save
    const hashed = await bcrypt.hash(password, 10);
    const doc = await User.create({
      name,
      email,
      password: hashed,
      role,
      shift,
    });

    return res.status(201).json({
      success: true,
      message: "User created",
      data: { _id: doc._id, name: doc.name, email: doc.email, role: doc.role, shift: doc.shift },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PUT /api/user/update/:id   (:id = Mongo _id)
 * Partial update, validates email uniqueness, optional password update
*/
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await User.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Updatable fields
    if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
    if (req.body.email !== undefined) {
      const email = String(req.body.email).toLowerCase().trim();
      if (email !== doc.email) {

        // Check for conflicts
        const exists = await User.findOne({ email, _id: { $ne: doc._id } }).lean();
        if (exists) {
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
        doc.email = email;
      }
    }
    if (req.body.role !== undefined) doc.role = req.body.role;
    if (req.body.shift !== undefined) doc.shift = req.body.shift;


    // Optional password change
    if (req.body.password) {
      const hashed = await bcrypt.hash(String(req.body.password), 10);
      doc.password = hashed;
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "User updated",
      data: { _id: doc._id, name: doc.name, email: doc.email, role: doc.role, shift: doc.shift },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/user/delete/:id   (:id = Mongo _id)
 * Remove user by mongoDB _id
*/
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "User deleted",
      data: { _id: deleted._id, name: deleted.name, email: deleted.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export { listUsers, addUser, updateUser, deleteUser };