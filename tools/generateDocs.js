import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Reads a file and extracts JSDoc comments for classes and methods.
 * @param {string} filePath - Path to the TypeScript file.
 * @returns {string} - Generated documentation in Markdown format.
 */
function generateDocs(filePath) {
  const fileContent = readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");

  let docs = "# API Documentation\n\n";
  let currentClass = null;

  lines.forEach((line, index) => {
    line = line.trim();

    // Find classes
    const classMatch = line.match(/export class (\w+)/);
    if (classMatch) {
      currentClass = classMatch[1];
      docs += `## ${currentClass}\n`;
      docs += `Description of the **${currentClass}** class.\n\n`;
    }

    // Find methods
    const methodMatch = line.match(/public (\w+)\((.*?)\)/);
    if (methodMatch && currentClass) {
      const methodName = methodMatch[1];
      const params = methodMatch[2];

      // Extract JSDoc comments
      const jsDocLines = [];
      for (let i = index - 1; i >= 0; i--) {
        const jsDocLine = lines[i].trim();
        if (jsDocLine.startsWith("/**")) break;
        if (jsDocLine.startsWith("*")) {
          jsDocLines.unshift(jsDocLine.replace("*", "").trim());
        }
      }

      // Remove JSDoc type annotations and trailing slashes from the description
      const description = jsDocLines
        .filter((line) => !line.startsWith("@")) // Exclude lines starting with @ (e.g., @param, @returns)
        .join(" ")
        .replace(/\/$/, "") // Remove trailing slashes
        .trim();

      docs += `### ${methodName}\n`;
      docs += `${description}\n\n`;
      docs += `**Parameters:**\n`;
      if (params) {
        params.split(",").forEach((param) => {
          const [name, type] = param.split(":").map((p) => p.trim());
          docs += `- \`${name}\` (${type})\n`;
        });
      } else {
        docs += "- No parameters\n";
      }
      docs += "\n";
    }
  });

  return docs;
}

/**
 * Saves the generated documentation to a file.
 * @param {string} outputPath - Path to save the documentation.
 * @param {string} content - Documentation content.
 */
function saveDocs(outputPath, content) {
  writeFileSync(outputPath, content, "utf-8");
  console.log(`Documentation successfully saved to ${outputPath}`);
}

// Path to the source code file
const inputFilePath = join(new URL(".", import.meta.url).pathname, "../src/generated-sources/api.ts");
// Path to save the documentation
const outputFilePath = join(new URL(".", import.meta.url).pathname, "../docs/API_DOCUMENTATION.md");

// Generate documentation
const documentation = generateDocs(inputFilePath);
// Save documentation
saveDocs(outputFilePath, documentation);