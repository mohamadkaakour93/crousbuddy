import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Récupère l'id et le rôle
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};
