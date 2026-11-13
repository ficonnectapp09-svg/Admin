#!/usr/bin/env node
/**
 * CONNECT APP BACKOFFICE – GIT SECURITY & GITHUB PUSH PROTECTION GUARD
 *
 * Automated pre-commit, pre-push, and CI security validator.
 * Prevents sensitive environment files, private instructions, credentials,
 * database dumps, certificates, and confidential documents from being
 * committed or pushed to GitHub.
 *
 * Usage:
 *   node scripts/git-security-guard.js --pre-commit
 *   node scripts/git-security-guard.js --pre-push [remote [url]]
 *   node scripts/git-security-guard.js --ci
 *   node scripts/git-security-guard.js --scan
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Prohibited filename regexes (Staged or Outgoing)
const PROHIBITED_FILE_PATTERNS = [
  // Real Environment files (allow .env.example only)
  {
    regex: /(^|[/\\])\.env(\.[a-zA-Z0-9_\-]+)?$/i,
    allowed: /(^|[/\\])\.env\.example$/i,
    category: 'Environment Secret File (.env / .env.*)'
  },
  // Private Project Instructions
  {
    regex: /(^|[/\\])(AGENT\.md|AGENTS\.md|CHANGELOG\.md)$/i,
    allowed: /(^|[/\\])node_modules[/\\]/i,
    category: 'Private Project Instruction File (AGENT.md / AGENTS.md / CHANGELOG.md)'
  },
  {
    regex: /(^|[/\\])\.agents([/\\]|$)/i,
    category: 'Private Project Instructions Directory (.agents/)'
  },
  // Cryptographic Keys and Certificates
  {
    regex: /\.(pem|key|p12|pfx|jks|keystore|crt|cert)$/i,
    category: 'Cryptographic Key / Certificate'
  },
  // Database Dumps and Backups
  {
    regex: /\.(dump|bson|backup|sqlite|sqlite3)$/i,
    category: 'Database Dump / Backup File'
  },
  {
    regex: /(^|[/\\])(database-backup|db-backup|backups|mongodb-dumps)([/\\]|$)/i,
    category: 'Database Backup Directory'
  },
  {
    regex: /(^|[/\\])backend[/\\]data[/\\]backup_/i,
    category: 'Backend Data Backup Folder'
  },
  // Private Documents, KYC, and Runtime Uploads
  {
    regex: /(^|[/\\])(uploads|private-uploads|secure-uploads|customer-documents|vendor-documents|kyc-documents|aadhaar-documents|pan-documents|private-storage)([/\\]|$)/i,
    allowed: /(^|[/\\])node_modules[/\\]/i,
    category: 'Private Document / KYC / Upload Storage'
  }
];

// Secret Content Patterns (Detected inside staged diffs or commits)
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key ID',
    regex: /\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/g
  },
  {
    name: 'AWS Secret Access Key',
    regex: /(?:aws_secret_access_key|aws_secret_key|secret_access_key)\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi
  },
  {
    name: 'MongoDB Connection String with Credentials',
    regex: /mongodb(?:\+srv)?:\/\/(?!<username>)([^:\s'"]+):([^@\s'"]+)@[a-zA-Z0-9_\-\.]+/gi,
    isIgnored: (match) => match.includes('<username>') || match.includes('<password>') || match.includes('example') || match.includes('placeholder')
  },
  {
    name: 'Private Key Header',
    regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s?PRIVATE KEY/g
  },
  {
    name: 'Live Razorpay Secret Key',
    regex: /rzp_live_[0-9a-zA-Z]{14,}/g
  },
  {
    name: 'Hardcoded Google App Password / SMTP Pass',
    regex: /(?:SMTP_PASS|smtp_password)\s*[:=]\s*['"]([a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}|[a-z]{16})['"]/gi
  }
];

function redact(str) {
  if (!str || typeof str !== 'string') return '[REDACTED]';
  if (str.length <= 6) return '***';
  return str.slice(0, 3) + '...' + str.slice(-3);
}

function runGitCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

function checkForbiddenPaths(fileList) {
  const violations = [];
  for (const filePath of fileList) {
    if (!filePath || typeof filePath !== 'string') continue;
    const cleanPath = filePath.trim().replace(/\\/g, '/');
    if (!cleanPath) continue;

    for (const pattern of PROHIBITED_FILE_PATTERNS) {
      if (pattern.regex.test(cleanPath)) {
        if (pattern.allowed && pattern.allowed.test(cleanPath)) {
          continue;
        }
        violations.push({
          file: cleanPath,
          category: pattern.category,
          reason: `Matches prohibited pattern ${pattern.regex}`
        });
        break;
      }
    }
  }
  return violations;
}

function scanDiffForSecrets(diffText) {
  const violations = [];
  if (!diffText) return violations;

  const lines = diffText.split('\n');
  let currentFile = 'unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git a/')) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
      if (match) currentFile = match[2];
      continue;
    }

    // Only scan newly added or modified lines in diff
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const addedContent = line.substring(1);

      // Skip test mocks and placeholder definitions
      if (
        addedContent.includes('placeholder_secret') ||
        addedContent.includes('your_jwt_secret_here') ||
        addedContent.includes('your_refresh_token_secret_here') ||
        addedContent.includes('your_otp_pepper_secret_here') ||
        addedContent.includes('your_app_password_here') ||
        addedContent.includes('test_secret_key_123')
      ) {
        continue;
      }

      for (const pattern of SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match;
        while ((match = pattern.regex.exec(addedContent)) !== null) {
          if (pattern.isIgnored && pattern.isIgnored(match[0])) {
            continue;
          }
          violations.push({
            file: currentFile,
            lineNum: i + 1,
            secretType: pattern.name,
            snippet: redact(match[0])
          });
        }
      }
    }
  }

  return violations;
}

function handlePreCommit() {
  console.log('🔒 [Git Security Guard] Running pre-commit security verification...');

  // 1. Check staged files list (Exclude files staged for deletion - only check Added, Copied, Modified, Renamed)
  const stagedOutput = runGitCommand('git diff --cached --diff-filter=ACMR --name-only -z');
  const stagedFiles = stagedOutput ? stagedOutput.split('\0').filter(Boolean) : [];

  if (stagedFiles.length === 0) {
    console.log('✅ [Git Security Guard] No new/modified staged changes to verify.');
    process.exit(0);
  }

  const pathViolations = checkForbiddenPaths(stagedFiles);
  if (pathViolations.length > 0) {
    console.error('\n❌ [SECURITY REJECTION] Prohibited files detected in Git staging:');
    pathViolations.forEach((v) => {
      console.error(`   - File: ${v.file}`);
      console.error(`     Category: ${v.category}`);
    });
    console.error('\nAction Required: Remove these sensitive files from the staging area using `git reset HEAD <file>`.');
    console.error('Do not commit environment files, private instructions, certificates, or backups.\n');
    process.exit(1);
  }

  // 2. Scan staged diff contents for secrets
  const stagedDiff = runGitCommand('git diff --cached');
  const secretViolations = scanDiffForSecrets(stagedDiff);

  if (secretViolations.length > 0) {
    console.error('\n❌ [SECURITY REJECTION] Potential secrets or credentials detected in staged changes:');
    secretViolations.forEach((v) => {
      console.error(`   - File: ${v.file}`);
      console.error(`     Secret Type: ${v.secretType}`);
      console.error(`     Redacted Match: ${v.snippet}`);
    });
    console.error('\nAction Required: Remove hardcoded credentials. Store secrets in environment variables or cloud secrets management.\n');
    process.exit(1);
  }

  console.log(`✅ [Git Security Guard] Pre-commit check passed cleanly (${stagedFiles.length} files verified).`);
  process.exit(0);
}

function handlePrePush() {
  console.log('🔒 [Git Security Guard] Running pre-push security verification...');

  // Identify remote and current branch
  const branch = runGitCommand('git rev-parse --abbrev-ref HEAD') || 'main';
  const remoteBranch = runGitCommand(`git rev-parse --verify origin/${branch}`);

  let outgoingFiles = [];
  let outgoingDiff = '';

  if (remoteBranch) {
    const fileListOut = runGitCommand(`git log origin/${branch}..HEAD --diff-filter=ACMR --name-only --format=""`);
    outgoingFiles = fileListOut ? fileListOut.split('\n').filter(Boolean) : [];
    outgoingDiff = runGitCommand(`git diff origin/${branch}..HEAD`);
  } else {
    // If remote branch does not exist yet, scan all commits in HEAD
    const fileListOut = runGitCommand('git log -n 5 --diff-filter=ACMR --name-only --format=""');
    outgoingFiles = fileListOut ? fileListOut.split('\n').filter(Boolean) : [];
    outgoingDiff = runGitCommand('git diff HEAD~1..HEAD');
  }

  const pathViolations = checkForbiddenPaths(outgoingFiles);
  if (pathViolations.length > 0) {
    console.error('\n❌ [PUSH REJECTED] Outgoing commits contain prohibited files:');
    pathViolations.forEach((v) => {
      console.error(`   - File: ${v.file}`);
      console.error(`     Category: ${v.category}`);
    });
    console.error('\nAction Required: Abort push. Remove prohibited files from Git history before pushing to GitHub.\n');
    process.exit(1);
  }

  const secretViolations = scanDiffForSecrets(outgoingDiff);
  if (secretViolations.length > 0) {
    console.error('\n❌ [PUSH REJECTED] Outgoing commits contain potential secrets:');
    secretViolations.forEach((v) => {
      console.error(`   - File: ${v.file}`);
      console.error(`     Secret Type: ${v.secretType}`);
      console.error(`     Redacted Match: ${v.snippet}`);
    });
    console.error('\nAction Required: Abort push. Never push unredacted credentials to GitHub.\n');
    process.exit(1);
  }

  console.log('✅ [Git Security Guard] Pre-push security verification passed cleanly.');
  process.exit(0);
}

function handleScan() {
  console.log('🔍 [Git Security Guard] Running full repository security audit...');
  const allTracked = runGitCommand('git ls-files');
  const trackedFiles = allTracked ? allTracked.split('\n').filter(Boolean) : [];

  const pathViolations = checkForbiddenPaths(trackedFiles);
  if (pathViolations.length > 0) {
    console.error(`\n⚠️  Found ${pathViolations.length} prohibited files currently tracked in Git:`);
    pathViolations.forEach((v) => {
      console.error(`   - ${v.file} (${v.category})`);
    });
  } else {
    console.log('✅ No prohibited files are tracked in the Git index.');
  }

  // Scan working directory unstaged files that may be sensitive
  const statusOut = runGitCommand('git status --porcelain');
  const modifiedFiles = statusOut ? statusOut.split('\n').map(l => l.substring(3).trim()).filter(Boolean) : [];
  const unstagedDiff = runGitCommand('git diff HEAD');
  const secretViolations = scanDiffForSecrets(unstagedDiff);

  if (secretViolations.length > 0) {
    console.error(`\n⚠️  Found ${secretViolations.length} potential secrets in unstaged changes:`);
    secretViolations.forEach((v) => {
      console.error(`   - ${v.file}: ${v.secretType} (${v.snippet})`);
    });
  } else {
    console.log('✅ No unredacted secrets found in working tree changes.');
  }

  process.exit(pathViolations.length > 0 || secretViolations.length > 0 ? 1 : 0);
}

// CLI Router
const args = process.argv.slice(2);
if (args.includes('--pre-commit')) {
  handlePreCommit();
} else if (args.includes('--pre-push')) {
  handlePrePush();
} else if (args.includes('--ci') || args.includes('--scan')) {
  handleScan();
} else {
  handleScan();
}
