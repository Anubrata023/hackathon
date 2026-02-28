// src/services/eligibility.service.js
// Core eligibility scoring engine for the AI-assisted checker

/**
 * scoreScholarship — scores a scholarship against user-provided criteria.
 * Returns: { eligible, partiallyEligible, score, reasons, missingCriteria, reason }
 */
exports.scoreScholarship = (inputs, scholarship) => {
  const {
    gender, category, incomeGroup, academicLevel,
    district, percentage, isMinority, isDisabled, dob,
  } = inputs;

  const reasons          = [];
  const missingCriteria  = [];
  let score              = 0;
  let eligibilityFails   = 0;

  // ── Category ────────────────────────────────────────────
  if (scholarship.eligibleCategories.length > 0) {
    if (scholarship.eligibleCategories.includes(category)) {
      score += 30;
      reasons.push(`Category ${category} matches`);
    } else {
      eligibilityFails++;
      missingCriteria.push(`Category must be one of: ${scholarship.eligibleCategories.join(', ')}`);
    }
  } else {
    score += 10; // Open to all categories
  }

  // ── Academic Level ───────────────────────────────────────
  if (scholarship.eligibleAcademicLevels.length > 0) {
    if (scholarship.eligibleAcademicLevels.includes(academicLevel)) {
      score += 30;
      reasons.push(`Academic level ${academicLevel} matches`);
    } else {
      eligibilityFails++;
      missingCriteria.push(`Academic level must be: ${scholarship.eligibleAcademicLevels.join(', ')}`);
    }
  } else {
    score += 10;
  }

  // ── Income Group ─────────────────────────────────────────
  if (scholarship.eligibleIncomeGroups.length > 0) {
    if (scholarship.eligibleIncomeGroups.includes(incomeGroup)) {
      score += 20;
      reasons.push(`Income group matches`);
    } else {
      eligibilityFails++;
      missingCriteria.push(`Annual family income must be in: ${scholarship.eligibleIncomeGroups.join(', ')}`);
    }
  } else {
    score += 5;
  }

  // ── Gender Restriction ───────────────────────────────────
  if (scholarship.onlyForGirls && gender !== 'FEMALE') {
    eligibilityFails++;
    missingCriteria.push('This scholarship is exclusively for female students');
  } else if (scholarship.onlyForGirls) {
    score += 10;
  }

  // ── Minority ─────────────────────────────────────────────
  if (scholarship.onlyForMinority && !isMinority) {
    eligibilityFails++;
    missingCriteria.push('This scholarship requires minority community membership');
  } else if (scholarship.onlyForMinority) {
    score += 10;
  }

  // ── Disability ───────────────────────────────────────────
  if (scholarship.onlyForDisabled && !isDisabled) {
    eligibilityFails++;
    missingCriteria.push('This scholarship requires a disability certificate');
  }

  // ── District ─────────────────────────────────────────────
  if (scholarship.requiresDistrict && district !== 'Kamrup Metropolitan') {
    eligibilityFails++;
    missingCriteria.push('Must be a resident of Kamrup Metropolitan district (Guwahati)');
  } else if (scholarship.requiresDistrict) {
    score += 10;
  }

  // ── Minimum Percentage ───────────────────────────────────
  if (scholarship.minPercentage !== null && percentage !== undefined) {
    if (parseFloat(percentage) >= scholarship.minPercentage) {
      score += 15;
      reasons.push(`Academic percentage ${percentage}% meets minimum ${scholarship.minPercentage}%`);
    } else {
      eligibilityFails++;
      missingCriteria.push(`Minimum ${scholarship.minPercentage}% required in last exam`);
    }
  }

  // ── Age ──────────────────────────────────────────────────
  if (dob && (scholarship.minAge || scholarship.maxAge)) {
    const age = Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
    if (scholarship.minAge && age < scholarship.minAge) {
      eligibilityFails++;
      missingCriteria.push(`Minimum age is ${scholarship.minAge} years`);
    } else if (scholarship.maxAge && age > scholarship.maxAge) {
      eligibilityFails++;
      missingCriteria.push(`Maximum age is ${scholarship.maxAge} years`);
    } else {
      score += 10;
    }
  }

  // ── Seat availability ────────────────────────────────────
  if (scholarship.seatsRemaining !== null) {
    if (scholarship.seatsRemaining <= 0) {
      return {
        eligible: false, partiallyEligible: false,
        score: 0, reason: 'No seats remaining', reasons: [], missingCriteria: [],
      };
    }
    score += 5;
  }

  const eligible           = eligibilityFails === 0;
  const partiallyEligible  = !eligible && eligibilityFails <= 1;

  return {
    eligible,
    partiallyEligible,
    score: eligible ? score : Math.round(score * 0.5),
    reasons,
    missingCriteria,
    reason: missingCriteria[0] || null,
  };
};

/**
 * checkStudentEligibility — checks an existing StudentProfile against a Scholarship.
 * Used during application creation.
 */
exports.checkStudentEligibility = async (profile, scholarship) => {
  const result = exports.scoreScholarship({
    category:      profile.category,
    incomeGroup:   profile.incomeGroup,
    academicLevel: profile.academicLevel,
    gender:        profile.gender,
    district:      profile.district,
    percentage:    profile.percentage,
    isMinority:    profile.isMinority,
    isDisabled:    profile.isDisabled,
    dob:           profile.dob,
  }, scholarship);

  return {
    eligible: result.eligible,
    reason:   result.missingCriteria[0] || null,
  };
};
