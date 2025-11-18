import mongoose from "mongoose";
import bcrypt from "bcrypt";

const User_Schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[0-9]+$/.test(v);
      },
      message: 'Phone number must contain only digits'
    }
  },
  address: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });

User_Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

User_Schema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User_Schema.index({ phone: 1 });

const User = mongoose.model("User", User_Schema);
export default User;