const fs = require('fs');
const sharp = require('sharp');
const wavDecoder = require('wav-decoder');

// Function to read a file
const readFile = (filepath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, buffer) => {
            if (err) {
                return reject(err);
            }
            return resolve(buffer);
        });
    });
};

// Function to generate waveform image
async function generateWaveformImage(inputWavFile) {
    // Read the WAV file
    const audioData = await readFile(inputWavFile).then((buffer) => {
        return wavDecoder.decode(buffer);
    });

    // Create an array for the waveform image
    const width = 800;
    const height = 400;
    const image = new Uint8Array(width * height * 3); // RGB image

    // Get audio samples from the first channel
    const samples = audioData.channelData[0];

    // Clear the image to light gray background
    image.fill(240); // Light gray background

    // Calculate slice width
    const sliceWidth = Math.ceil(samples.length / width);
    let x = 0;

    // Draw the waveform
    for (let i = 0; i < width; i++) {
        // Average samples for the current slice
        const sliceStart = i * sliceWidth;
        const sliceEnd = sliceStart + sliceWidth;
        const sliceSamples = samples.slice(sliceStart, sliceEnd);
        const average = sliceSamples.reduce((sum, value) => sum + value, 0) / sliceSamples.length;
        const y = (average * height) / 2 + height / 2; // Scale to canvas height

        // Ensure y is within bounds
        if (y < 0) y = 0;
        if (y >= height) y = height - 1;

        // Set pixel color for the waveform
        const colorIndex = (y * width + i) * 3; // RGB

        if (colorIndex >= 0 && colorIndex < image.length) {
            image[colorIndex] = 0;     // Red
            image[colorIndex + 1] = 0; // Green
            image[colorIndex + 2] = 255; // Blue
        }
    }

    // Save the image as PNG using sharp
    const pngBuffer = await sharp(Buffer.from(image), {
        raw: {
            width: width,
            height: height,
            channels: 3,
        },
    })
    .png()
    .toBuffer();

    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_'); // Replace invalid characters
    const outputImageFile = `output_waveform_${timestamp}.png`; // Filename with date and time

    // Write the PNG image to a file
    fs.writeFileSync(outputImageFile, pngBuffer);
    console.log(`Waveform image saved as ${outputImageFile}`);
}

// Example usage
const inputWavFile = 'uploads/1729746515045-male-snore.wav'; // Replace with your WAV file path
generateWaveformImage(inputWavFile);
