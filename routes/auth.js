import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import nodemailer from "nodemailer";

const router = express.Router();



// Middleware pour vérifier le token JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  };
  

router.post('/signup/student', async (req, res) => {
    const { name, birthDate, city, email, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newStudent = new Student({
        name,
        birthDate,
        city,
        email,
        password: hashedPassword,
      });
  
      await newStudent.save();
  
      const token = generateToken({ _id: newStudent._id, role: 'Student' });
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  router.post('/signup/host', async (req, res) => {
    const { name, birthDate, city, address, houseSize, email, password } = req.body;
  
    if (houseSize < 18) {
      return res.status(400).json({ message: 'La maison doit mesurer au moins 18m².' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newHost = new Host({
        name,
        birthDate,
        city,
        address,
        houseSize,
        email,
        password: hashedPassword,
      });
  
      await newHost.save();
  
      const token = generateToken({ _id: newHost._id, role: 'Host' });
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
    
// Route Login
router.post(
    '/login',
    [
        check('email', 'Veuillez fournir un email valide').isEmail(),
        check('password', 'Le mot de passe est obligatoire').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Vérifier si l'utilisateur existe
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Identifiants invalides.' });
            }

            // Vérifier le mot de passe
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Identifiants invalides.' });
            }

            // Générer un token JWT
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ token });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Erreur serveur.');
        }
    }
);

router.post('/auth/send-reset-password-email', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }
  
      // Générer un token de réinitialisation
      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token valide pour 1 heure
      });
  
      // Construire le lien de réinitialisation
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      // Envoyer l'e-mail
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: '"CROUS Buddy" <crousbuddy@gmail.com>',
        to: email,
        subject: 'Réinitialisation du mot de passe',
        text: `Bonjour,\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n${resetLink}\n\nCe lien est valide pendant 1 heure.\n\nCordialement,\nL'équipe CROUS Buddy`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ message: 'E-mail de réinitialisation envoyé avec succès.' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail de réinitialisation :', error.message);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'e-mail.' });
    }
  }); 

  router.post('/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
  
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Trouver l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }
  
      // Mettre à jour le mot de passe
      user.password = await bcrypt.hash(newPassword, 10); // Hasher le nouveau mot de passe
      await user.save();
  
      res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe :', error.message);
      res.status(400).json({ message: 'Token invalide ou expiré.' });
    }
  });
  




export default router;
