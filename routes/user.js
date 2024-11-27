import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import {addUserToSearch} from '../scrape.js';


const router = express.Router();

/*router.post('/search', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id; // ID de l'utilisateur connecté récupéré depuis le middleware
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
  
      const { city, occupationModes } = req.body;
  
      // Vérification des paramètres
      if (!city || !occupationModes) {
        return res.status(400).json({
          message: "Les champs 'city' et 'occupationModes' sont obligatoires.",
        });
      }
  
      // Mise à jour des préférences de l'utilisateur dans la base
      user.preferences.city = city;
      user.preferences.occupationModes = occupationModes;
      await user.save();
  
      // Déclenchement du scraping pour cet utilisateur
      scrapeWebsite({
        email: user.email,
        preferences: {
          city: user.preferences.city,
          occupationModes: user.preferences.occupationModes,
        },
      });
  
      return res.status(200).json({
        message: "La recherche a été lancée. Vous recevrez un e-mail dès qu’un logement sera trouvé.",
      });
    } catch (error) {
      console.error('Erreur lors du lancement de la recherche :', error.message);
      return res.status(500).json({
        message: "Erreur serveur lors de la recherche.",
      });
    }
  });*/

  router.post("/search", authMiddleware, async (req, res) => {
    const userId = req.user.id; // ID de l'utilisateur connecté récupéré depuis le middleware

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Si l'utilisateur est un hébergeur (Host), on le bloque de la recherche
        if (user.role === 'Host') {
            return res.status(403).json({
                message: "Les hébergeurs ne peuvent pas utiliser cette fonctionnalité.",
            });
        }

        // Si c'est un étudiant, on récupère ses préférences
        let preferences;
        if (user.role === "Student" && user.studentDetails) {
            preferences = user.studentDetails;  // Récupérer les préférences d'un étudiant
        } else if (user.role === "Host" && user.hostDetails) {
            preferences = user.hostDetails;  // Récupérer les préférences d'un hébergeur (si jamais nécessaire)
        }

        if (!preferences) {
            return res.status(400).json({ message: "Les préférences utilisateur sont manquantes." });
        }

        console.log(`Préférences de l'utilisateur avec l'ID ${userId}:`, preferences);

        // Appeler la fonction de recherche automatique
        addUserToSearch(userId);

        res.status(200).json({
            message: "Votre recherche automatique a été lancée. Vous recevrez un e-mail dès qu'un logement sera trouvé.",
        });
    } catch (error) {
        console.error("Erreur lors du traitement de la recherche :", error.message);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

  

// Backend - Route pour récupérer le profil de l'utilisateur
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Renvoie les données appropriées en fonction du rôle
    res.status(200).json({
      email: user.email,
      role: user.role,
      studentDetails: user.studentDetails,  // Données de l'étudiant
      hostDetails: user.hostDetails,        // Données de l'hébergeur
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Mettre à jour le profil utilisateur (PUT /api/user/me)
router.put('/me', authMiddleware, async (req, res) => {
  const { email, preferences, hostDetails } = req.body;

  try {
      const user = await User.findById(req.user.id);
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }

      // Mettre à jour l'email (champs généraux)
      if (email) user.email = email;

      // Mettre à jour les préférences si l'utilisateur est un étudiant
      if (user.role === 'Student' && preferences) {
          user.studentDetails = {
              city: preferences.city || user.studentDetails.city,
              occupationModes: preferences.occupationModes || user.studentDetails.occupationModes,
          };
      }
      // Mettre à jour les détails de l'hôte si l'utilisateur est un hébergeur
      else if (user.role === 'Host' && hostDetails) {
          user.hostDetails = {
              name: hostDetails.name || user.hostDetails.name,
              address: hostDetails.address || user.hostDetails.address,
              houseSize: hostDetails.houseSize || user.hostDetails.houseSize,
          };
      }

      // Sauvegarder les modifications dans la base de données
      await user.save();
      res.status(200).json({ message: 'Profil mis à jour avec succès.', user });
  } catch (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Supprimer le profil utilisateur (DELETE /api/user/me)
router.delete('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression du profil utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

export default router;
