import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Reads a TypeScript file and extracts JSDoc comments to generate API documentation in Markdown format.
 * @param {string} filePath - Path to the TypeScript file.
 * @returns {string} - Generated API documentation.
 */
function generateDocs(filePath) {
  const fileContent = readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n')

  let docs = `# API Documentation 🚀\n\n`
  docs += `Welcome to the API documentation. This document describes the available API endpoints, their parameters, and how to use them effectively.\n\n`
  docs += `## Table of Contents\n\n`

  let currentClass = null
  const tableOfContents = []

  lines.forEach((line, index) => {
    line = line.trim()

    // Find classes
    const classMatch = line.match(/export class (\w+)/)
    if (classMatch) {
      currentClass = classMatch[1]
      tableOfContents.push(`- [${currentClass}](#${currentClass.toLowerCase()})`)
      docs += `\n---\n## 🏢 ${currentClass}\n---\n`
      docs += `Description of the **${currentClass}** class.\n\n`
    }

    // Find methods
    const methodMatch = line.match(/public (\w+)\((.*?)\)/)
    if (methodMatch && currentClass) {
      const methodName = methodMatch[1]
      const params = methodMatch[2]

      // Extract JSDoc comments
      const jsDocLines = []
      let exampleBlock = ''
      for (let i = index - 1; i >= 0; i--) {
        const jsDocLine = lines[i].trim()
        if (jsDocLine.startsWith('/**')) break
        if (jsDocLine.startsWith('*')) {
          const cleanLine = jsDocLine.replace('*', '').trim()
          if (cleanLine.startsWith('@example')) {
            exampleBlock += '\n**Example:**\n```typescript\n'
          } else if (exampleBlock) {
            exampleBlock += cleanLine + '\n'
          } else {
            jsDocLines.unshift(cleanLine)
          }
        }
      }
      if (exampleBlock) {
        exampleBlock += '```\n'
      }

      const description = jsDocLines
        .filter(line => !line.startsWith('@'))
        .join(' ')
        .replace(/\/$/, '')
        .trim()

      docs += `### 🛠 ${methodName}\n`
      docs += `${description}\n\n`
      docs += `**Parameters:**\n`
      if (params) {
        params.split(',').forEach(param => {
          const [name, type] = param.split(':').map(p => p.trim())
          docs += `- \`${name}\` (*${type}*) – Description here.\n`
        })
      } else {
        docs += '- No parameters\n'
      }
      docs += '\n' + exampleBlock
    }
  })

  // Add table of contents
  docs = docs.replace('## Table of Contents\n\n', '## Table of Contents\n\n' + tableOfContents.join('\n') + '\n\n')

  return docs
}

/**
 * Saves the generated documentation to a file.
 * @param {string} outputPath - Path to save the documentation.
 * @param {string} content - Documentation content.
 */
function saveDocs(outputPath, content) {
  writeFileSync(outputPath, content, 'utf-8')
  console.log(`📄 Documentation successfully saved to ${outputPath}`)
}

// Paths
const inputFilePath = join(new URL('.', import.meta.url).pathname, '../src/generated-sources/api.ts')
const outputFilePath = join(new URL('.', import.meta.url).pathname, '../docs/API_DOCUMENTATION.md')

// Generate and save documentation
const documentation = generateDocs(inputFilePath)
saveDocs(outputFilePath, documentation)
