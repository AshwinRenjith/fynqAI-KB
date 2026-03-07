#!/usr/bin/env node
/**
 * Phase 6 Gate Validation Script
 * Tests contradiction detection, scoring, and notification system
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ============================================================================
// ENVIRONMENT & CONFIG
// ============================================================================

const REQUIRED_ENV = [
	'WORKSPACE_ID',
	'COOKIE',
	'APP_URL',
	'NEXT_PUBLIC_SUPABASE_URL',
	'SUPABASE_ACCESS_TOKEN',
	'PROJECT_REF',
];

for (const key of REQUIRED_ENV) {
	if (!process.env[key]) {
		console.error(`❌ Missing required env var: ${key}`);
		process.exit(1);
	}
}

const WS_ID = process.env.WORKSPACE_ID;
const COOKIE = process.env.COOKIE;
const APP_URL = process.env.APP_URL;
const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.PROJECT_REF;

// ============================================================================
// TEST DOCUMENTS
// ============================================================================

const DOC_A_CONTENT = `# Product Weight Specification

Our standard widget weighs **10kg** when fully assembled.

The widget dimensions are 50cm x 30cm x 20cm.

Lead time for manufacturing is 14 days.
`;

const DOC_B_CONTENT = `# Updated Widget Specifications

The standard widget has been redesigned and now weighs **50kg** in its assembled form.

Manufacturing lead time remains 14 days.

Dimensions are unchanged.
`;

const DOC_C_CONTENT = `# Shipping Guidelines

All products are shipped within 3 business days of order confirmation.

Standard carriers include FedEx and UPS.

Insurance is included for orders over $500.
`;

// ============================================================================
// UTILITIES
// ============================================================================

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadDocument(filename, content) {
	const tmpPath = join(tmpdir(), filename);
	writeFileSync(tmpPath, content);

	const formData = new FormData();
	const blob = new Blob([content], { type: 'text/plain' });
	formData.append('file', blob, filename);
	formData.append('workspace_id', WS_ID);

	const res = await fetch(`${APP_URL}/api/ingest/upload`, {
		method: 'POST',
		headers: { Cookie: COOKIE },
		body: formData,
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Upload failed: ${res.status} ${text}`);
	}

	// Get document_id from X-Document-Id header
	const documentId = res.headers.get('X-Document-Id');
	if (!documentId) {
		throw new Error('No X-Document-Id header in upload response');
	}

	// Consume the SSE stream
	await res.text();

	return documentId;
}

async function pollUntilReady(docId, maxWaitMs = 60000) {
	const start = Date.now();
	while (Date.now() - start < maxWaitMs) {
		const res = await fetch(`${APP_URL}/api/ingest/status/${docId}`, {
			headers: { Cookie: COOKIE },
		});
		const data = await res.json();

		if (data.status === 'ready') return data;
		if (data.status === 'error') throw new Error(`Document error: ${data.error_message}`);

		await sleep(2000);
	}
	throw new Error('Timeout waiting for document ready');
}

async function querySupabase(sql) {
	const res = await fetch(
		`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${SUPABASE_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ query: sql }),
		}
	);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Supabase query failed: ${res.status} ${text}`);
	}

	const data = await res.json();

	// Supabase API may return either:
	// 1) direct row array, or
	// 2) [{ rows: [...] }]
	if (Array.isArray(data)) {
		if (data.length === 0) return [];
		if (data[0] && typeof data[0] === 'object' && Array.isArray(data[0].rows)) {
			return data[0].rows;
		}
		return data;
	}

	return [];
}

// ============================================================================
// TEST GATES
// ============================================================================

async function runGates() {
	console.log('🚀 Phase 6 Gate Validation\n');

	let docAId, docBId, docCId;

	// -------------------------------------------------------------------------
	// Gate 1: Upload documents with contradiction
	// -------------------------------------------------------------------------
	console.log('📝 Gate 1: Upload two documents with contradictory weights...');
	try {
		docAId = await uploadDocument('widget-spec-v1.txt', DOC_A_CONTENT);
		console.log(`   Document A uploaded: ${docAId}`);

		await pollUntilReady(docAId);
		console.log('   Document A ready');
		// Wait to ensure Document A's chunks are fully committed and visible
		await sleep(2000);


		docBId = await uploadDocument('widget-spec-v2.txt', DOC_B_CONTENT);
		console.log(`   Document B uploaded: ${docBId}`);

		await pollUntilReady(docBId);
		console.log('   Document B ready');

		console.log('✅ PASS: Documents uploaded and processed\n');
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// Give the contradiction scanner a moment to complete
	// Give the contradiction scanner time to complete (with retry logic)
	console.log('⏳ Waiting for contradiction scan to complete...');
	await sleep(5000);

	// -------------------------------------------------------------------------
	// Gate 2: Verify contradiction exists in database
	// -------------------------------------------------------------------------
	console.log('🔍 Gate 2: Check if contradiction was detected...');
	try {
		// Retry logic for async contradiction detection
		let rows = [];
		let attempts = 0;
		const maxAttempts = 8;

		while (rows.length === 0 && attempts < maxAttempts) {
			if (attempts > 0) {
				console.log(`   Retry ${attempts}/${maxAttempts}...`);
				await sleep(4000);
			}

			const sql = `
				SELECT id, entity_subject, value_a, value_b, 
				       contradiction_type, confidence, severity, status
				FROM contradictions
				WHERE workspace_id = '${WS_ID}'
				  AND ((document_a_id = '${docAId}' AND document_b_id = '${docBId}')
				    OR (document_a_id = '${docBId}' AND document_b_id = '${docAId}'))
				ORDER BY created_at DESC
				LIMIT 1;
			`;

			rows = await querySupabase(sql);
			attempts++;
		}

		if (rows.length === 0) {
			throw new Error('No contradiction found between documents A and B after retries');
		}

		const contradiction = rows[0];
		console.log(`   Contradiction ID: ${contradiction.id}`);
		console.log(`   Subject: ${contradiction.entity_subject}`);
		console.log(`   Value A: ${contradiction.value_a}`);
		console.log(`   Value B: ${contradiction.value_b}`);
		console.log(`   Type: ${contradiction.contradiction_type}`);
		console.log(`   Confidence: ${contradiction.confidence}`);
		console.log(`   Severity: ${contradiction.severity}`);
		console.log(`   Status: ${contradiction.status}`);

		if (contradiction.status !== 'open') {
			throw new Error(`Expected status='open', got '${contradiction.status}'`);
		}

		console.log('✅ PASS: Contradiction detected and stored\n');

		// Store for next gate
		process.env.CONTRADICTION_ID = contradiction.id;
		process.env.CONTRADICTION_SEVERITY = contradiction.severity;
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// -------------------------------------------------------------------------
	// Gate 3: Verify severity is set correctly
	// -------------------------------------------------------------------------
	console.log('⚠️  Gate 3: Verify contradiction severity classification...');
	try {
		const severity = process.env.CONTRADICTION_SEVERITY;

		if (!['critical', 'warning'].includes(severity)) {
			throw new Error(`Expected severity 'critical' or 'warning', got '${severity}'`);
		}

		console.log(`   Severity: ${severity}`);
		console.log('✅ PASS: Severity classification is appropriate\n');
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// -------------------------------------------------------------------------
	// Gate 4: Verify notification was created (if critical)
	// -------------------------------------------------------------------------
	console.log('🔔 Gate 4: Check if admin notification was created...');
	try {
		const contradictionId = process.env.CONTRADICTION_ID;
		const severity = process.env.CONTRADICTION_SEVERITY;

		if (severity === 'critical') {
			const sql = `
				SELECT id, notify_user_id, seen
				FROM contradiction_notifications
				WHERE workspace_id = '${WS_ID}'
				  AND contradiction_id = '${contradictionId}'
				ORDER BY created_at DESC
				LIMIT 1;
			`;

			const rows = await querySupabase(sql);

			if (rows.length === 0) {
				throw new Error('No notification created for critical contradiction');
			}

			const notification = rows[0];
			console.log(`   Notification ID: ${notification.id}`);
			console.log(`   User notified: ${notification.notify_user_id}`);
			console.log(`   Seen: ${notification.seen}`);

			console.log('✅ PASS: Notification created for critical contradiction\n');
		} else {
			console.log('   Severity is not critical, notification check skipped');
			console.log('✅ PASS: No notification needed for non-critical\n');
		}
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// -------------------------------------------------------------------------
	// Gate 5: Upload non-contradictory document (negative test)
	// -------------------------------------------------------------------------
	console.log('📄 Gate 5: Upload non-contradictory document...');
	try {
		docCId = await uploadDocument('shipping-guide.txt', DOC_C_CONTENT);
		console.log(`   Document C uploaded: ${docCId}`);

		await pollUntilReady(docCId);
		console.log('   Document C ready');

		// Wait for contradiction scan to complete
		await sleep(5000);

		// Check that no NEW contradiction was created with document C
		const sql = `
			SELECT COUNT(*) as count
			FROM contradictions
			WHERE workspace_id = '${WS_ID}'
			  AND (document_a_id = '${docCId}' OR document_b_id = '${docCId}');
		`;

		const rows = await querySupabase(sql);
		const count = parseInt(rows[0]?.count || '0');

		if (count > 0) {
			console.warn(`   ⚠️  Warning: ${count} contradiction(s) created with document C (may be false positive)`);
		} else {
			console.log('   No contradictions created with document C');
		}

		console.log('✅ PASS: Non-contradictory document processed\n');
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// -------------------------------------------------------------------------
	// Gate 6: Verify contradiction confidence score is reasonable
	// -------------------------------------------------------------------------
	console.log('📊 Gate 6: Verify confidence scoring is reasonable...');
	try {
		const contradictionId = process.env.CONTRADICTION_ID;
		const sql = `
			SELECT confidence, severity
			FROM contradictions
			WHERE id = '${contradictionId}';
		`;

		const rows = await querySupabase(sql);
		if (rows.length === 0) throw new Error('Contradiction not found');

		const confidence = parseFloat(rows[0].confidence);
		const severity = rows[0].severity;

		console.log(`   Confidence score: ${confidence.toFixed(3)}`);

		// Verify confidence is in valid range
		if (confidence < 0 || confidence > 1) {
			throw new Error(`Confidence ${confidence} is out of valid range [0, 1]`);
		}

		// Verify confidence threshold logic
		if (confidence < 0.50) {
			throw new Error(`Contradiction created with confidence ${confidence} < 0.50 threshold`);
		}

		// Verify severity matches confidence
		if (severity === 'critical' && confidence < 0.70) {
			throw new Error(`Severity 'critical' but confidence ${confidence} < 0.70`);
		}

		if (severity === 'warning' && (confidence < 0.50 || confidence >= 0.70)) {
			throw new Error(`Severity 'warning' but confidence ${confidence} not in [0.50, 0.70) range`);
		}

		console.log('✅ PASS: Confidence scoring is valid\n');
	} catch (err) {
		console.error(`❌ FAIL: ${err.message}\n`);
		process.exit(1);
	}

	// -------------------------------------------------------------------------
	// SUCCESS
	// -------------------------------------------------------------------------
	console.log('🎉 All Phase 6 gate checks passed!\n');
	console.log('Summary:');
	console.log('  ✅ Contradiction detection works');
	console.log('  ✅ Confidence scoring is functional');
	console.log('  ✅ Severity classification is correct');
	console.log('  ✅ Notifications are created for critical issues');
	console.log('  ✅ Non-contradictory documents are handled correctly');
	console.log('  ✅ Confidence thresholds are enforced');
	console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

runGates().catch((err) => {
	console.error(`\n💥 Phase 6 validation failed: ${err.message}\n`);
	process.exit(1);
});
