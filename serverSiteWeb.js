require('dotenv').config(); // Charger les variables d'environnement depuis un fichier .env

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const SftpClient = require('ssh2-sftp-client');
const os = require('os');

// Initialiser l'application Express
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Charger la configuration SFTP depuis les variables d'environnement
const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || '22',
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
    readyTimeout: 30000,
};

// Vérifier que toutes les variables d'environnement nécessaires sont définies
if (!sftpConfig.host || !sftpConfig.username || !sftpConfig.password) {
    console.error('Erreur : certaines variables d\'environnement SFTP sont manquantes.');
    process.exit(1); // Arrêter l'application si des variables manquent
}

// Fonction pour écrire des logs dans un fichier
function writeLog(message) {
    const logFilePath = path.join(__dirname, 'app.log');
    const logEntry = `${new Date().toISOString()} : ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
}

// Fonction pour enregistrer les données dans un fichier de log local
function logReceivedData(data) {
    writeLog(`Données reçues :\n${JSON.stringify(data, null, 2)}\n`);
}

// Fonction pour créer ou mettre à jour un fichier HTML avec les données
function createHtmlFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fichier ${filePath} créé/actualisé avec succès.`);
}

// Fonction pour convertir les données en fichiers HTML
function convertDataToHtmlFiles(data) {
    let frenchContent = '';
    let englishContent = '';

    data.forEach(item => {
        if (item.language === 'FR') {
            frenchContent += item.content;
        } else if (item.language === 'EN') {
            englishContent += item.content;
        }
    });

    const frenchFilePath = path.join(__dirname, 'data_calendrier.html');
    const englishFilePath = path.join(__dirname, 'data_calendar.html');

    createHtmlFile(frenchFilePath, frenchContent);
    createHtmlFile(englishFilePath, englishContent);
}

// Fonction pour téléverser des fichiers et actualiser les métadonnées sur le serveur SFTP
async function uploadFilesToSFTP() {
    const sftp = new SftpClient();
    try {
        await sftp.connect(sftpConfig);

        const frenchFilePath = path.join(__dirname, 'data_calendrier.html');
        const englishFilePath = path.join(__dirname, 'data_calendar.html');

        // 1. Téléverser les nouveaux fichiers HTML
        await sftp.put(frenchFilePath, '/martinmessier/Private/Data/data_calendrier.html');
        await sftp.put(englishFilePath, '/martinmessier/Private/Data/data_calendar.html');

        console.log('Fichiers téléversés avec succès.');

        // 2. Mettre à jour les métadonnées des fichiers sur le serveur
        const remoteFrenchFilePath = '/martinmessier/calendrier-martin-messier.html';
        const remoteEnglishFilePath = '/martinmessier/artist-martin-messier-calendar.html';

        // Télécharger le contenu actuel des fichiers à actualiser
        const frenchFileContent = await sftp.get(remoteFrenchFilePath);
        const englishFileContent = await sftp.get(remoteEnglishFilePath);

        // Créer des fichiers temporaires locaux pour les téléverser à nouveau
        const localFrenchFilePath = path.join(os.tmpdir(), 'calendrier-martin-messier.html');
        const localEnglishFilePath = path.join(os.tmpdir(), 'artist-martin-messier-calendar.html');

        fs.writeFileSync(localFrenchFilePath, frenchFileContent);
        fs.writeFileSync(localEnglishFilePath, englishFileContent);

        // Téléverser les fichiers pour actualiser les métadonnées
        await sftp.put(localFrenchFilePath, remoteFrenchFilePath);
        await sftp.put(localEnglishFilePath, remoteEnglishFilePath);

        console.log('Métadonnées des fichiers mises à jour avec succès.');
    } catch (err) {
        console.error('Erreur lors de la mise à jour des fichiers ou des métadonnées SFTP :', err.message);
    } finally {
        await sftp.end();
        console.log('Déconnexion du serveur SFTP.');
    }
}

// Route pour recevoir les données POST
app.post('/', async (req, res) => {
    const data = req.body;

    // Afficher les données reçues dans le terminal
    console.log('Données reçues :', data);

    // Enregistrer les données reçues dans un fichier de log
    logReceivedData(data);

    // Convertir les données en fichiers HTML
    convertDataToHtmlFiles(data);

    // Téléverser les fichiers sur le serveur SFTP
    await uploadFilesToSFTP();

    res.send('Fichiers mis à jour avec succès.');
});

// Démarrer le serveur sur le port 8082
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
    console.log(`Serveur en ligne et en écoute sur le port ${PORT}`);
    writeLog(`Serveur en écoute sur le port ${PORT}`);
});
