// lib/contradiction/normalize.ts
/**
 * Phase 6 — Contradiction Agent
 * Normalizes entity values and determines if values conflict across documents
 */

const UNIT_TO_BASE: Record<string, number> = {
	// Weight (to kg)
	g: 0.001,
	kg: 1,
	t: 1000,
	lb: 0.453,
	// Volume (to liters)
	ml: 0.001,
	l: 1,
	fl_oz: 0.02957,
	// Length (to meters)
	mm: 0.001,
	cm: 0.01,
	m: 1,
	km: 1000,
	ft: 0.3048,
	in: 0.0254,
	// Time (to days)
	day: 1,
	days: 1,
	week: 7,
	weeks: 7,
	month: 30,
	months: 30,
	year: 365,
	years: 365,
};

const UNIT_FAMILY: Record<string, string> = {
	g: 'weight', kg: 'weight', t: 'weight', lb: 'weight',
	ml: 'volume', l: 'volume', fl_oz: 'volume',
	mm: 'length', cm: 'length', m: 'length', km: 'length', ft: 'length', in: 'length',
	day: 'time', days: 'time', week: 'time', weeks: 'time',
	month: 'time', months: 'time', year: 'time', years: 'time',
};

/**
 * Returns the unit family (weight, volume, length, time) or null if unknown.
 */
export function getUnitFamily(unit: string): string | null {
	return UNIT_FAMILY[unit.toLowerCase().trim()] ?? null;
}

/**
 * Normalizes a quantity with unit to its base unit
 * @param amount - Numeric value
 * @param unit - Unit string (e.g., 'kg', 'ft', 'days')
 * @returns Normalized value in base unit, or null if unit is unknown
 */
export function normalizeToBase(amount: number, unit: string): number | null {
	const factor = UNIT_TO_BASE[unit.toLowerCase().trim()];
	return factor !== undefined ? amount * factor : null;
}

/**
 * Checks if two entity values conflict
 * @param entityA - First entity with normalized_value field
 * @param entityB - Second entity with normalized_value field
 * @returns true if values differ significantly, false otherwise
 */
export function valuesConflict(
	entityA: Record<string, unknown>,
	entityB: Record<string, unknown>
): boolean {
	const normA = entityA.normalized_value as Record<string, unknown> | undefined;
	const normB = entityB.normalized_value as Record<string, unknown> | undefined;

	if (!normA || !normB) return false;

	// Quantity conflict: compare amounts after normalization
	if (
		typeof normA.amount === 'number' &&
		typeof normB.amount === 'number' &&
		normA.unit &&
		normB.unit
	) {
		// Ensure units are from the same family before comparing
		const familyA = getUnitFamily(normA.unit as string);
		const familyB = getUnitFamily(normB.unit as string);
		if (familyA !== familyB) return false; // Different dimensions — not comparable

		const baseA = normalizeToBase(normA.amount, normA.unit as string);
		const baseB = normalizeToBase(normB.amount, normB.unit as string);

		// Same units after normalization — compare values with 1% threshold
		if (baseA !== null && baseB !== null) {
			const percentDiff = Math.abs(baseA - baseB) / Math.max(baseA, baseB);
			return percentDiff > 0.01; // >1% difference = conflict
		}

		// Couldn't normalize — not comparable
		return false;
	}

	// Price conflict: must have same currency and different amounts
	if (
		typeof normA.amount === 'number' &&
		typeof normB.amount === 'number' &&
		normA.currency &&
		normB.currency
	) {
		return normA.amount !== normB.amount || normA.currency !== normB.currency;
	}

	// Policy rules — use string comparison (not identical = potential conflict)
	if (normA.rule && normB.rule) {
		return normA.rule !== normB.rule;
	}
	if (entityA.type === 'POLICY_RULE' && entityB.type === 'POLICY_RULE') {
		const valueA = String(entityA.value ?? '').trim().toLowerCase();
		const valueB = String(entityB.value ?? '').trim().toLowerCase();
		return valueA.length > 0 && valueB.length > 0 && valueA !== valueB;
	}

	// Date conflicts
	if (normA.iso && normB.iso) {
		return normA.iso !== normB.iso;
	}
	if (normA.date && normB.date) {
		return normA.date !== normB.date;
	}

	// Definition conflicts
	if (normA.definition && normB.definition) {
		return normA.definition !== normB.definition;
	}
	if (entityA.type === 'DEFINITION' && entityB.type === 'DEFINITION') {
		const valueA = String(entityA.value ?? '').trim().toLowerCase();
		const valueB = String(entityB.value ?? '').trim().toLowerCase();
		return valueA.length > 0 && valueB.length > 0 && valueA !== valueB;
	}

	// Product/person entities can represent contradictory facts in policy docs.
	if (entityA.type === 'PRODUCT' && entityB.type === 'PRODUCT') {
		const valueA = String(entityA.value ?? '').trim().toLowerCase();
		const valueB = String(entityB.value ?? '').trim().toLowerCase();
		return valueA.length > 0 && valueB.length > 0 && valueA !== valueB;
	}

	if (entityA.type === 'PERSON' && entityB.type === 'PERSON') {
		const valueA = String(entityA.value ?? '').trim().toLowerCase();
		const valueB = String(entityB.value ?? '').trim().toLowerCase();
		return valueA.length > 0 && valueB.length > 0 && valueA !== valueB;
	}

	return false;
}

/**
 * Checks if two entity scopes overlap
 * @param scopeA - First entity scope (e.g., "US", "Europe", null for global)
 * @param scopeB - Second entity scope
 * @returns true if scopes overlap or are both global, false if disjoint
 */
export function scopesOverlap(scopeA: string | null, scopeB: string | null): boolean {
	// No scope = global = overlaps with everything
	if (!scopeA || !scopeB) return true;

	const a = scopeA.toLowerCase();
	const b = scopeB.toLowerCase();

	// Simple disjoint region check
	const regions = [
		['eu', 'europe', 'european'],
		['us', 'usa', 'united states', 'america'],
		['uk', 'britain', 'united kingdom'],
		['asia', 'apac', 'asia pacific'],
		['china', 'cn'],
		['india', 'in'],
	];

	for (const region of regions) {
		const aInRegion = region.some((r) => a.includes(r));
		const bInRegion = region.some((r) => b.includes(r));

		// One is in region, other is not = disjoint
		if (aInRegion !== bInRegion) return false;
	}

	// Default: assume overlap if we can't determine disjointness
	return true;
}
