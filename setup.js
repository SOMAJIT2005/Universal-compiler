const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const AdmZip = require('adm-zip');
const axios = require('axios');

const platform = os.platform();

async function buildProduct() {
    console.log(`-> 1. Detected OS: ${platform}`);
    
    if (platform === 'win32') {
        console.log("-> 2. Downloading universal Windows C++ compiler (w64devkit)...");
        const url = "https://github.com/skeeto/w64devkit/releases/download/v1.20.0/w64devkit-1.20.0.zip";
        const zipPath = path.join(__dirname, "compiler.zip");
        const extractPath = path.join(__dirname, "compiler");

        try {
            const response = await axios({ url, method: 'GET', responseType: 'stream' });
            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log("-> 3. Extracting compiler...");
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);
            fs.unlinkSync(zipPath);
        } catch (error) {
            console.error("Failed to download compiler:", error.message);
            return;
        }
    } else {
        console.log("-> 2. macOS/Linux detected. Skipping bundled compiler (will use native system GCC/Clang).");
    }

    console.log(`-> 4. Packaging the Universal Extension...`);
    try {
        // Removed the strict OS architecture flag. This makes the .vsix file universally 
        // installable on any Windows machine (x64, x86, ARM64).
        execSync(`npx vsce package --no-dependencies --allow-missing-repository`, { stdio: "inherit" });
        console.log(`\n✅ SUCCESS! Your universal product has been generated!`);
    } catch (error) {
        console.error("Packaging failed. Ensure you have run 'npm install' first.");
    }
}

buildProduct();