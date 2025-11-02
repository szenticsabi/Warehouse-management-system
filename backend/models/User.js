import mongoose from "mongoose";

/** User schema
 * name: display name
 * email: unique, normalized with lowercase and trim
 * password: hashed value, stored bcrypt hash
 * role: enum ("admin" or "employee")
 * shift: enum ("morning", "afternoon" or "night")
 * timestamps: adds createdAt and updatedAt fields
 */
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    shift: { type: String, enum: ["morning", "afternoon", "night"], default: "morning" }
},
    {
        timestamps: true
    })

const User = mongoose.model("User", userSchema);
export default User;