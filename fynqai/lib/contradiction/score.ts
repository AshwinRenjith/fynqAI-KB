// lib/contradiction/score.ts
/**
 * Phase 6 — Contradiction Agent
 * Confidence scoring for detected contradictions using multiple signals
 */

import type { Entity } from '@/types/app.types';

export interface ScoringInput {
	entityA: Entity;
	entityB: Entity;
	docACreatedAt: string;
	docBCreatedAt: string;
	scopeOverlap: boolean;
	valuesDiffer: boolean;
}

/**
 * Calculates contradiction confidence score (0-1) using weighted signals
 * 
 * Scoring factors:
 * - Subject similarity (0.35): How similar are the entity subjects?
 * - Value divergence (0.30): Do the values actually differ?
 * - Scope collision (0.20): Do the scopes overlap?
 * - Temporal recency (0.15): How recent are both documents?
 * 
 * @param input - Scoring input with entities and metadata
 * @returns Confidence score between 0 and 1
 */
export function scoreContradiction(input: ScoringInput): number {
	let score = 0;

	// 1. Subject similarity (0.35 weight) — Jaccard similarity
	const subjA = input.entityA.subject.toLowerCase().trim();
	const subjB = input.entityB.subject.toLowerCase().trim();
	
	// Tokenize subjects into words
	const wordsA = new Set(subjA.split(/\s+/).filter((w) => w.length > 0));
	const wordsB = new Set(subjB.split(/\s+/).filter((w) => w.length > 0));
	
	// Calculate Jaccard similarity: |intersection| / |union|
	const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
	const union = new Set([...wordsA, ...wordsB]);
	const jaccardSim = union.size > 0 ? intersection.size / union.size : 0;
	
	score += jaccardSim * 0.35;

	// 2. Value divergence (0.30 weight) — Binary: do values differ?
	score += (input.valuesDiffer ? 1.0 : 0.0) * 0.30;

	// 3. Scope collision (0.20 weight) — Binary: do scopes overlap?
	score += (input.scopeOverlap ? 1.0 : 0.0) * 0.20;

	// 4. Temporal recency (0.15 weight) — Penalize if docs are far apart in time
	const msA = new Date(input.docACreatedAt).getTime();
	const msB = new Date(input.docBCreatedAt).getTime();
	const ageDiffDays = Math.abs(msA - msB) / (1000 * 60 * 60 * 24);
	
	// Documents >180 days apart get 30% penalty on temporal score
	// This reduces false positives from old vs new documents
	const temporalPenalty = ageDiffDays > 180 ? 0.3 : 0;
	score += (1 - temporalPenalty) * 0.15;

	// Clamp score to [0, 1] range
	return Math.min(Math.max(score, 0), 1);
}

/**
 * Determines contradiction severity based on confidence score
 * @param confidence - Score from scoreContradiction function
 * @returns Severity classification
 */
export function determineSeverity(confidence: number): 'critical' | 'warning' | 'info' {
	if (confidence >= 0.70) return 'critical';
	if (confidence >= 0.50) return 'warning';
	return 'info';
}
