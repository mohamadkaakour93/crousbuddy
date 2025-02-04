import fs from 'fs';
import path from 'path';
import pdf from 'html-pdf';
import { fileURLToPath } from 'url';

// Résoudre __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generatePDF(host, student) {
  return new Promise((resolve, reject) => {
    // Charger le modèle HTML
    const templatePath = path.join(__dirname, '../templates/attestationTemplate.html');
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Remplacer les variables dynamiques dans le HTML
    const htmlWithValues = htmlTemplate
      .replace('{{hostName}}', host.hostDetails.name)
      .replace('{{hostBirthDate}}', host.hostDetails.birthDate)
      .replace('{{hostAddress}}', host.hostDetails.address)
      .replace('{{hostPostalCode}}', host.hostDetails.postalCode || 'Non spécifié')
      .replace('{{hostCity}}', host.hostDetails.city)
      .replace('{{studentName}}', student.name)
      .replace('{{studentBirthDate}}', student.birthDate)
      .replace('{{startDate}}', new Date().toLocaleDateString('fr-FR')) // Date dynamique
      .replace('{{hostCity}}', host.hostDetails.city)
      .replace('{{currentDate}}', new Date().toLocaleDateString('fr-FR'));
      


    // Ajouter la signature dynamique
    const signatureImageTag = host.hostDetails.signature
      ? `<img src="data:image/png;base64,${host.hostDetails.signature}" alt="Signature" style="width: 150px; height: auto;">`
      : '________________________';
    const htmlWithSignature = htmlWithValues.replace('{{hostSignature}}', signatureImageTag);
    console.log('Signature de l\'hôte :', host.hostDetails.signature);


    // Définir le chemin du fichier PDF
    const outputDir = path.join(__dirname, '../attestations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const fileName = `attestation_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // Générer le PDF
    pdf.create(htmlWithSignature).toFile(filePath, (err, res) => {
      if (err) {
        reject(new Error(`Erreur lors de la génération du PDF : ${err.message}`));
      } else {
        resolve(filePath);
      }
    });
  });
}

export default generatePDF;
