#!/usr/bin/env node
/**
 * Generate Kotlin design tokens from tokens.json
 * 
 * Usage: node scripts/generate-android.js [output-path]
 * Default output: ../../tally-android/tallycore/src/main/java/app/tally/core/design/Tokens.kt
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '../tokens.json');
const defaultOutput = resolve(__dirname, '../../../tally-android/tallycore/src/main/java/app/tally/core/design/Tokens.kt');
const outputPath = process.argv[2] || defaultOutput;

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateKotlin() {
  const lines = [
    '// Auto-generated from tokens.json - DO NOT EDIT',
    '// Run: npm run generate:android in packages/design-tokens',
    '',
    'package app.tally.core.design',
    '',
    'import androidx.compose.ui.unit.dp',
    '',
    '/**',
    ' * Tally Design Tokens',
    ' * Cross-platform design tokens for consistent styling.',
    ' */',
    'object TallyTokens {',
    '',
    '    // MARK: - Brand Colors',
    '    object Brand {',
  ];

  // Brand colors
  for (const [name, data] of Object.entries(tokens.colors.brand)) {
    if (data.description) {
      lines.push(`        /** ${data.description} */`);
    }
    lines.push(`        const val ${name} = "${data.value}"`);
  }
  lines.push('    }');
  lines.push('');

  // Status colors
  lines.push('    // MARK: - Status Colors');
  lines.push('    object Status {');
  for (const [name, data] of Object.entries(tokens.colors.status)) {
    if (data.description) {
      lines.push(`        /** ${data.description} */`);
    }
    lines.push(`        const val ${name}Light = "${data.light}"`);
    lines.push(`        const val ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Chart colors
  lines.push('    // MARK: - Chart Colors');
  lines.push('    object Chart {');
  for (const [name, data] of Object.entries(tokens.colors.chart)) {
    lines.push(`        const val ${name}Light = "${data.light}"`);
    lines.push(`        const val ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Heatmap colors
  lines.push('    // MARK: - Heatmap Colors');
  lines.push('    object Heatmap {');
  for (const [name, data] of Object.entries(tokens.colors.heatmap)) {
    lines.push(`        const val ${name}Light = "${data.light}"`);
    lines.push(`        const val ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Record colors
  lines.push('    // MARK: - Record Colors');
  lines.push('    object Records {');
  for (const [name, value] of Object.entries(tokens.colors.records)) {
    lines.push(`        const val ${name} = "${value}"`);
  }
  lines.push('    }');
  lines.push('');

  // Spacing
  lines.push('    // MARK: - Spacing');
  lines.push('    object Spacing {');
  lines.push(`        val unit = ${tokens.spacing.unit}.dp`);
  for (const [name, value] of Object.entries(tokens.spacing.scale)) {
    // Convert names like "2xl" to "_2xl" for Kotlin
    const kotlinName = name.replace(/^(\d)/, '_$1');
    lines.push(`        val ${kotlinName} = ${value}.dp`);
  }
  lines.push('    }');
  lines.push('');

  // Radii
  lines.push('    // MARK: - Corner Radii');
  lines.push('    object Radii {');
  for (const [name, value] of Object.entries(tokens.radii)) {
    const kotlinName = name.replace(/^(\d)/, '_$1');
    lines.push(`        val ${kotlinName} = ${value}.dp`);
  }
  lines.push('    }');
  lines.push('');

  // Motion
  lines.push('    // MARK: - Motion');
  lines.push('    object Motion {');
  lines.push('        object Duration {');
  for (const [name, value] of Object.entries(tokens.motion.duration)) {
    lines.push(`            const val ${name} = ${value}L // ms`);
  }
  lines.push('        }');
  lines.push('        object Easing {');
  for (const [name, value] of Object.entries(tokens.motion.easing)) {
    lines.push(`            const val ${name} = "${value}"`);
  }
  lines.push('        }');
  lines.push('    }');

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// Ensure output directory exists
mkdirSync(dirname(outputPath), { recursive: true });

// Write Kotlin file
const kotlin = generateKotlin();
writeFileSync(outputPath, kotlin);
console.log(`Generated: ${outputPath}`);
