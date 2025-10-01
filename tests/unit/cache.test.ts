/**
 * T047: Unit tests for cache manager
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CacheManager } from '../../src/services/cache/manager.js';
import { applyDefaults } from '../../src/models/ComponentConfig.js';
import { WebpageAnalysis } from '../../src/models/WebpageAnalysis.js';
import { GeneratedComponent } from '../../src/models/GeneratedComponent.js';

describe('Cache Manager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
    cacheManager.clear();
  });

  const createMockAnalysis = (): WebpageAnalysis => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    url: 'https://example.com',
    timestamp: new Date(),
    state: 'completed',
    screenshot: Buffer.from('mock-screenshot'),
    domStructure: {
      tagName: 'body',
      attributes: {},
      children: [],
    },
    colorPalette: [
      { hex: '#000000', rgb: [0, 0, 0], usage: 'text', frequency: 10 },
    ],
    typography: [
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '1.5',
        selector: 'body',
      },
    ],
    layoutPatterns: [],
    semanticStructure: [],
    pageMetrics: {
      domElements: 100,
      resourceSize: 1024,
      loadTime: 1000,
      renderTime: 500,
      viewportWidth: 1920,
      viewportHeight: 1080,
    },
  });

  const createMockComponent = (): GeneratedComponent => ({
    id: '223e4567-e89b-12d3-a456-426614174000',
    analysisId: '123e4567-e89b-12d3-a456-426614174000',
    framework: 'react',
    styling: 'tailwind',
    code: 'function Component() { return <div>Hello</div>; }',
    imports: ["import React from 'react';"],
    dependencies: [
      { name: 'react', version: '^18.2.0', type: 'production' },
    ],
    metadata: {
      generatedAt: new Date(),
      generationTime: 5000,
      llavaVersion: 'llava:7b',
      codellamaVersion: 'codellama:13b',
      templateVersion: '1.0.0',
    },
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const key1 = cacheManager.getCacheKey('https://example.com', config);
      const key2 = cacheManager.getCacheKey('https://example.com', config);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different URLs', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const key1 = cacheManager.getCacheKey('https://example.com', config);
      const key2 = cacheManager.getCacheKey('https://other.com', config);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different configs', () => {
      const config1 = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const config2 = applyDefaults({
        framework: 'vue',
        styling: 'css',
      });

      const key1 = cacheManager.getCacheKey('https://example.com', config1);
      const key2 = cacheManager.getCacheKey('https://example.com', config2);

      expect(key1).not.toBe(key2);
    });

    it('should normalize URLs for consistent keys', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'css',
      });

      const key1 = cacheManager.getCacheKey('https://example.com?utm_source=test', config);
      const key2 = cacheManager.getCacheKey('https://example.com', config);

      expect(key1).toBe(key2);
    });
  });

  describe('get and set', () => {
    it('should store and retrieve cache entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example.com', config, entry);
      const retrieved = cacheManager.get('https://example.com', config);

      expect(retrieved).toBeDefined();
      expect(retrieved?.analysis.id).toBe(entry.analysis.id);
      expect(retrieved?.component.id).toBe(entry.component.id);
    });

    it('should return undefined for non-existent entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'css',
      });

      const result = cacheManager.get('https://notfound.com', config);

      expect(result).toBeUndefined();
    });

    it('should update cachedAt timestamp on set', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const beforeSet = Date.now();

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(0), // Old timestamp
      };

      cacheManager.set('https://example.com', config, entry);
      const retrieved = cacheManager.get('https://example.com', config);

      expect(retrieved?.cachedAt.getTime()).toBeGreaterThanOrEqual(beforeSet);
    });
  });

  describe('has', () => {
    it('should return true for existing entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example.com', config, entry);

      expect(cacheManager.has('https://example.com', config)).toBe(true);
    });

    it('should return false for non-existent entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'css',
      });

      expect(cacheManager.has('https://notfound.com', config)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example.com', config, entry);
      const deleted = cacheManager.delete('https://example.com', config);

      expect(deleted).toBe(true);
      expect(cacheManager.has('https://example.com', config)).toBe(false);
    });

    it('should return false when deleting non-existent entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'css',
      });

      const deleted = cacheManager.delete('https://notfound.com', config);

      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      const config1 = applyDefaults({ framework: 'react', styling: 'tailwind' });
      const config2 = applyDefaults({ framework: 'vue', styling: 'css' });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example1.com', config1, entry);
      cacheManager.set('https://example2.com', config2, entry);

      const cleared = cacheManager.clear();

      expect(cleared).toBe(2);
      expect(cacheManager.has('https://example1.com', config1)).toBe(false);
      expect(cacheManager.has('https://example2.com', config2)).toBe(false);
    });

    it('should return 0 when clearing empty cache', () => {
      const cleared = cacheManager.clear();

      expect(cleared).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example.com', config, entry);
      const stats = cacheManager.getStats();

      expect(stats.entries).toBe(1);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.evictions).toBeGreaterThanOrEqual(0);
    });

    it('should track oldest and newest entries', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      cacheManager.set('https://example.com', config, entry);
      const stats = cacheManager.getStats();

      expect(stats.oldestEntry).toBeInstanceOf(Date);
      expect(stats.newestEntry).toBeInstanceOf(Date);
    });

    it('should calculate hit rate correctly', () => {
      const config = applyDefaults({
        framework: 'react',
        styling: 'tailwind',
      });

      const entry = {
        analysis: createMockAnalysis(),
        component: createMockComponent(),
        cachedAt: new Date(),
      };

      // Set entry
      cacheManager.set('https://example.com', config, entry);

      // Miss
      cacheManager.get('https://notfound.com', config);

      // Hit
      cacheManager.get('https://example.com', config);

      // Hit
      cacheManager.get('https://example.com', config);

      const stats = cacheManager.getStats();

      // 2 hits, 1 miss = 2/3 = 0.666...
      expect(stats.hitRate).toBeCloseTo(0.666, 2);
    });
  });

  describe('maintenance', () => {
    it('should run without errors', () => {
      expect(() => cacheManager.maintenance()).not.toThrow();
    });
  });
});
