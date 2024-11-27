import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Student', 'Host'],
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
      signature: { 
        type: String,
        required: function() { return this.role === 'Host'; } // Signature requise uniquement pour les hôtes
      },
    },
    createdAt: { type: Date, default: Date.now },
  });
  

// Calcul automatique des attestations pour les hébergeurs
UserSchema.pre('save', function (next) {
    // Si l'utilisateur est un hébergeur, on calcule `maxAttestations`
    if (this.role === 'Host' && this.hostDetails.houseSize) {
      this.hostDetails.maxAttestations = Math.floor((this.hostDetails.houseSize - 9) / 9);
    }
  
    // Mise à jour du champ `preferences` selon le rôle
    if (this.role === 'Student' && this.studentDetails) {
      this.preferences = {
        city: this.studentDetails.city,
        occupationModes: this.studentDetails.occupationModes,
      };
    } else if (this.role === 'Host' && this.hostDetails) {
      this.preferences = {
        city: this.hostDetails.city,
        occupationModes: '',  // Les hôtes n'ont pas de mode d'occupation
      };
    }
  
    // Passer au prochain middleware
    next();
  });
  

const User = mongoose.model('User', UserSchema);
export default User;
