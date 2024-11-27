import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Host'], // Définit le rôle de l'utilisateur
    required: true,
  },
  studentDetails: {
    name: { type: String },
    birthDate: { type: String },
    city: { type: String },
    occupationModes: {
      type: String,
      enum: ['house_sharing', 'alone', 'couple'],
    },
  },
  hostDetails: {
    name: { type: String },
    birthDate: { type: String },
    city: { type: String },
    address: { type: String },
    houseSize: { type: Number },
    maxAttestations: { type: Number, default: 0 },
    currentAttestations: { type: Number, default: 0 },
    signature: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

// Calcul automatique des attestations pour les hébergeurs
UserSchema.pre('save', function (next) {
  if (this.role === 'Host' && this.hostDetails.houseSize) {
    this.hostDetails.maxAttestations = Math.floor((this.hostDetails.houseSize - 9) / 9);
  }
  next();
});

const User = mongoose.model('User', UserSchema);
export default User;
