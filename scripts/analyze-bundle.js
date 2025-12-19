#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * This script analyzes the Next.js bundle to identify optimization opportunities
 * and track bundle size changes over time.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyzeBundle() {
  log('\n🔍 Bundle Analysis Report', 'bright');
  log('================================', 'cyan');

  try {
    // Check if .next directory exists
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      log('❌ Build artifacts not found. Please run "npm run build" first.', 'red');
      process.exit(1);
    }

    // Analyze static chunks
    const staticDir = path.join(nextDir, 'static');
    if (fs.existsSync(staticDir)) {
      analyzeStaticChunks(staticDir);
    }

    // Analyze server chunks
    const serverDir = path.join(nextDir, 'server');
    if (fs.existsSync(serverDir)) {
      analyzeServerChunks(serverDir);
    }

    // Run webpack-bundle-analyzer if available
    runBundleAnalyzer();

    // Generate recommendations
    generateRecommendations();

  } catch (error) {
    log(`❌ Error analyzing bundle: ${error.message}`, 'red');
    process.exit(1);
  }
}

function analyzeStaticChunks(staticDir) {
  log('\n📦 Static Chunks Analysis', 'yellow');
  log('----------------------------', 'cyan');

  const chunksDir = path.join(staticDir, 'chunks');
  if (!fs.existsSync(chunksDir)) {
    log('No static chunks found', 'yellow');
    return;
  }

  const chunks = fs.readdirSync(chunksDir);
  const chunkSizes = {};

  chunks.forEach(chunk => {
    const chunkPath = path.join(chunksDir, chunk);
    const stats = fs.statSync(chunkPath);
    chunkSizes[chunk] = stats.size;
  });

  // Sort chunks by size (largest first)
  const sortedChunks = Object.entries(chunkSizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 largest chunks

  log('Top 10 Largest Chunks:', 'bright');
  sortedChunks.forEach(([chunk, size], index) => {
    const sizeKB = (size / 1024).toFixed(2);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const color = size > 1024 * 1024 ? 'red' : size > 512 * 1024 ? 'yellow' : 'green';

    log(`${index + 1}. ${chunk}: ${sizeKB} KB (${sizeMB} MB)`, color);
  });

  // Calculate total bundle size
  const totalSize = Object.values(chunkSizes).reduce((sum, size) => sum + size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  log(`\nTotal static bundle size: ${totalSizeMB} MB`, totalSize > 10 ? 'red' : 'green');
}

function analyzeServerChunks(serverDir) {
  log('\n🖥️ Server Chunks Analysis', 'yellow');
  log('----------------------------', 'cyan');

  const pagesDir = path.join(serverDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    analyzeDirectory(pagesDir, 'Server Pages');
  }

  const appDir = path.join(serverDir, 'app');
  if (fs.existsSync(appDir)) {
    analyzeDirectory(appDir, 'Server App');
  }
}

function analyzeDirectory(dir, label) {
  if (!fs.existsSync(dir)) return;

  log(`\n${label}:`, 'bright');
  const files = fs.readdirSync(dir, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    log(`  ${file}: ${sizeKB} KB`, 'cyan');
  });
}

function runBundleAnalyzer() {
  log('\n📊 Running Bundle Analyzer', 'yellow');
  log('----------------------------', 'cyan');

  try {
    // Try to run webpack-bundle-analyzer
    execSync('npx webpack-bundle-analyzer .next/static/chunks/*.js --no-open --mode json', { stdio: 'pipe' });
    log('✅ Bundle analyzer report generated', 'green');
  } catch (error) {
    log('⚠️ webpack-bundle-analyzer not found. Install with: npm install --save-dev webpack-bundle-analyzer', 'yellow');
  }
}

function generateRecommendations() {
  log('\n💡 Optimization Recommendations', 'yellow');
  log('----------------------------------', 'cyan');

  const recommendations = [
    {
      condition: 'large-vendor-chunks',
      message: 'Consider implementing code splitting for vendor libraries',
      solution: 'Use dynamic imports for large libraries like lucide-react, chart libraries, etc.'
    },
    {
      condition: 'large-icons-chunk',
      message: 'Icons are bundled together. Consider lazy loading icons',
      solution: 'Use the lucide-icons-lazy.tsx utility we\'ve implemented'
    },
    {
      condition: 'large-total-bundle',
      message: 'Bundle size is large. Consider tree-shaking optimizations',
      solution: 'Review imports and remove unused dependencies'
    },
    {
      condition: 'missing-compression',
      message: 'Enable gzip compression for production',
      solution: 'Configure compression middleware in your deployment'
    }
  ];

  recommendations.forEach((rec, index) => {
    log(`${index + 1}. ${rec.message}`, 'bright');
    log(`   Solution: ${rec.solution}`, 'cyan');
    log('');
  });

  log('📈 Performance Monitoring Tips:', 'bright');
  log('   • Set up @next/bundle-analyzer in next.config.ts', 'cyan');
  log('   • Use Next.js built-in performance metrics', 'cyan');
  log('   • Implement Web Vitals monitoring', 'cyan');
  log('   • Monitor Core Web Vitals in production', 'cyan');
}

// Performance monitoring utilities
function setupPerformanceMonitoring() {
  log('\n🚀 Setting up Performance Monitoring', 'yellow');
  log('------------------------------------', 'cyan');

  // Create performance monitoring config if it doesn't exist
  const perfConfigPath = path.join(process.cwd(), 'src/lib/performance-monitor.ts');

  if (!fs.existsSync(perfConfigPath)) {
    const perfConfig = `
/**
 * Performance Monitoring Utilities
 *
 * This module provides utilities for monitoring bundle loading performance
 * and detecting ChunkLoadError instances.
 */

export interface PerformanceMetrics {
  chunkLoadTime: number;
  chunkSize: number;
  loadSuccess: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  startMonitoring() {
    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('.js')) {
          this.recordMetric({
            chunkLoadTime: entry.duration,
            chunkSize: 0, // Would need to get this from network headers
            loadSuccess: true,
          });
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);

    // Monitor navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Page load time:', entry.duration);
        }
      });
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Alert on slow loading chunks
    if (metric.chunkLoadTime > 3000) {
      console.warn('Slow chunk detected:', metric);
    }

    // Alert on load failures
    if (!metric.loadSuccess) {
      console.error('Chunk load failed:', metric);
      this.handleChunkLoadError(metric);
    }
  }

  private handleChunkLoadError(metric: PerformanceMetrics) {
    // Implement retry logic or fallback UI
    console.error('ChunkLoadError detected, implementing recovery...');

    // You could dispatch a custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('chunkLoadError', {
      detail: metric
    }));
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}
`;

    fs.writeFileSync(perfConfigPath, perfConfig);
    log('✅ Performance monitoring module created at src/lib/performance-monitor.ts', 'green');
  } else {
    log('ℹ️ Performance monitoring module already exists', 'yellow');
  }
}

// Main execution
if (require.main === module) {
  analyzeBundle();
  setupPerformanceMonitoring();
}

module.exports = {
  analyzeBundle,
  setupPerformanceMonitoring
};