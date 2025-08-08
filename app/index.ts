import path from "path";
import fs from "fs";
import { resizeImage } from "./resize";

const run = async () => {
  const inputPath = path.join(process.cwd(), "image.jpg");
  const outputDir = path.join(process.cwd(), "output");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input image not found at: ${inputPath}`);
  }

  const widths = [400, 800, 1200];
  const results: string[] = [];

  // Read the input image
  const inputBuffer = fs.readFileSync(inputPath);
  

  for (const width of widths) {
    try {
      console.log(`Resizing image to width: ${width}px`);

      // Resize the image using qrimzn
      const resizedBuffer = await resizeImage(inputBuffer, width);

      // Save the resized image
      const outputPath = path.join(outputDir, `resized_${width}px.png`);
      fs.writeFileSync(outputPath, resizedBuffer);

      results.push(outputPath);
      console.log(`Saved resized image to: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to resize image to ${width}px:`, error);
      throw error;
    }
  }

  return results;
};

run()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
