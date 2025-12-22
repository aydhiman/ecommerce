import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Admin_Schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'admin', enum: ['admin', 'superadmin'] },
  isActive: { type: Boolean, default: true },
  permissions: {
    canResetPasswords: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: true },
    canManageSellers: { type: Boolean, default: true },
    canManageProducts: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true }
  }
}, { timestamps: true });

Admin_Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

Admin_Schema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

Admin_Schema.index({ email: 1 });

const Admin = mongoose.model("Admin", Admin_Schema);
export default Admin;
