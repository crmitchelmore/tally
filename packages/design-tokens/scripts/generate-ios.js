#!/usr/bin/env node
/**
 * Generate Swift design tokens from tokens.json
 * 
 * Usage: node scripts/generate-ios.js [output-path]
 * Default output: ../../tally-ios/TallyDesignSystem/Sources/Tokens.swift
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(__dirname, '../tokens.json');
const defaultOutput = resolve(__dirname, '../../../tally-ios/TallyDesignSystem/Sources/Tokens.swift');
const outputPath = process.argv[2] || defaultOutput;

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

// Convert oklch to hex approximation (simplified - for display purposes)
// In production, you'd want to use a proper color space conversion library
function oklchToHex(oklch) {
  // This is a placeholder - iOS will use the raw oklch values with Color extensions
  return oklch;
}

function generateSwift() {
  const lines = [
    '// Auto-generated from tokens.json - DO NOT EDIT',
    '// Run: npm run generate:ios in packages/design-tokens',
    '',
    'import SwiftUI',
    '',
    '// MARK: - Design Tokens',
    '',
    'public enum TallyTokens {',
    '',
    '    // MARK: - Brand Colors',
    '    public enum Brand {',
  ];

  // Brand colors
  for (const [name, data] of Object.entries(tokens.colors.brand)) {
    lines.push(`        /// ${data.description || name}`);
    lines.push(`        public static let ${name} = "${data.value}"`);
  }
  lines.push('    }');
  lines.push('');

  // Status colors (with light/dark variants)
  lines.push('    // MARK: - Status Colors');
  lines.push('    public enum Status {');
  for (const [name, data] of Object.entries(tokens.colors.status)) {
    lines.push(`        /// ${data.description || name}`);
    lines.push(`        public static let ${name}Light = "${data.light}"`);
    lines.push(`        public static let ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Chart colors
  lines.push('    // MARK: - Chart Colors');
  lines.push('    public enum Chart {');
  for (const [name, data] of Object.entries(tokens.colors.chart)) {
    lines.push(`        public static let ${name}Light = "${data.light}"`);
    lines.push(`        public static let ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Heatmap colors
  lines.push('    // MARK: - Heatmap Colors');
  lines.push('    public enum Heatmap {');
  for (const [name, data] of Object.entries(tokens.colors.heatmap)) {
    lines.push(`        public static let ${name}Light = "${data.light}"`);
    lines.push(`        public static let ${name}Dark = "${data.dark}"`);
  }
  lines.push('    }');
  lines.push('');

  // Record colors
  lines.push('    // MARK: - Record Colors');
  lines.push('    public enum Records {');
  for (const [name, value] of Object.entries(tokens.colors.records)) {
    lines.push(`        public static let ${name} = "${value}"`);
  }
  lines.push('    }');
  lines.push('');

  // Spacing
  lines.push('    // MARK: - Spacing');
  lines.push('    public enum Spacing {');
  lines.push(`        public static let unit: CGFloat = ${tokens.spacing.unit}`);
  for (const [name, value] of Object.entries(tokens.spacing.scale)) {
    const swiftName = name.replace(/^(\d)/, '_$1'); // Prefix numbers with underscore
    lines.push(`        public static let ${swiftName}: CGFloat = ${value}`);
  }
  lines.push('    }');
  lines.push('');

  // Radii
  lines.push('    // MARK: - Corner Radii');
  lines.push('    public enum Radii {');
  for (const [name, value] of Object.entries(tokens.radii)) {
    const swiftName = name.replace(/^(\d)/, '_$1');
    lines.push(`        public static let ${swiftName}: CGFloat = ${value}`);
  }
  lines.push('    }');
  lines.push('');

  // Motion
  lines.push('    // MARK: - Motion');
  lines.push('    public enum Motion {');
  lines.push('        public enum Duration {');
  for (const [name, value] of Object.entries(tokens.motion.duration)) {
    lines.push(`            public static let ${name}: Double = ${value / 1000}`); // Convert to seconds
  }
  lines.push('        }');
  lines.push('    }');

  lines.push('}');
  lines.push('');

  // Helper extension for oklch colors (placeholder)
  lines.push('// MARK: - Color Extension');
  lines.push('');
  lines.push('extension Color {');
  lines.push('    /// Parse oklch color string (simplified - uses system colors as fallback)');
  lines.push('    public init(oklch: String) {');
  lines.push('        // TODO: Implement proper oklch parsing');
  lines.push('        // For now, this is a placeholder that needs proper implementation');
  lines.push('        self = .primary');
  lines.push('    }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// Ensure output directory exists
mkdirSync(dirname(outputPath), { recursive: true });

// Write Swift file
const swift = generateSwift();
writeFileSync(outputPath, swift);
console.log(`Generated: ${outputPath}`);
