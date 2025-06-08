// generate-hash.js
import bcrypt from 'bcryptjs';

async function generateHashes() {
    const adminPassword = 'admin123';
    const periodistaPassword = 'periodista123';
    const visualizadorPassword = 'visualizador123';

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const periodistaHash = await bcrypt.hash(periodistaPassword, 10);
    const visualizadorHash = await bcrypt.hash(visualizadorPassword, 10);

    console.log(`Password: ${adminPassword}, Hash: ${adminHash}`);
    console.log(`Password: ${periodistaPassword}, Hash: ${periodistaHash}`);
    console.log(`Password: ${visualizadorPassword}, Hash: ${visualizadorHash}`);
}

generateHashes();