import express from 'express';
import { sendEmail } from '../utils/emailService.js';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import Attestaion from '../models/Attestaion.js';
import generatePDF from '../utils/pdfGenerator.js';
const router = express.Router();

// Recherche des hébergeurs avec authentification
router.get('/match-hosts/:city', authMiddleware, async (req, res) => {
  const city = req.params.city;

  try {
    const hosts = await User.find({
      'hostDetails.city': city,  // Filtre sur l'attribut 'hostDetails.city'
      'role': 'Host',  // Vérifie que l'utilisateur est un 'Host'
      $expr: { $gt: ["$hostDetails.maxAttestations", "$hostDetails.currentAttestations"] },  // Vérifie si les attestations restantes sont disponibles
    });

    if (hosts.length === 0) {
      return res.status(404).json({ error: 'Aucun hébergeur disponible pour cette ville.' });
    }

    res.status(200).json(hosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


  

router.post('/auto-generate-attestation', async (req, res) => {
  const { student, hostId } = req.body;

  try {
    const host = await User.findById(hostId);  // Utilisez User au lieu de Host
    if (!host || host.hostDetails.currentAttestations >= host.hostDetails.maxAttestations) {
      return res.status(400).json({ error: 'Hébergeur non disponible.' });
    }

    console.time('PDF Generation'); // Démarrer le chronomètre pour la génération du PDF

    // Générer le PDF
    const filePath = await generatePDF(host, student);
    console.timeEnd('PDF Generation');

    console.time('Email Sending');
    // Envoyer l'email avec l'attestation en pièce jointe
    await sendEmail(
        student.email,
        'Votre attestation d’hébergement',
        'Veuillez trouver ci-joint votre attestation d’hébergement.',
        filePath
    );
    console.timeEnd('Email Sending');

    // Mettre à jour le compteur d'attestations de l'hébergeur
    host.hostDetails.currentAttestations += 1;
    await host.save();

    res.status(200).json({ message: 'Attestation générée avec succès.', filePath });
  } catch (err) {
    console.error('Erreur lors de la génération de l’attestation :', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
