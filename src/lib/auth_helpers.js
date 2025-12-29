import { verifyJWT } from './sign_jwt.js';
import crypto from 'crypto';

export async function getDeviceId(username, userAgent) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username + '::' + userAgent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Resolve course code using fuzzy keyword matching
 * Fallback when exact name match fails
 */
export function resolveCourseByKeyword(profile) {
    const text = String(profile?.program || profile?.branch || '').toLowerCase().trim();
    if (!text) return null;
    
    const keywords = {
        "PS": ["psychology"],
        "SM": ["sports"],
        "PH": ["pharmacy"],
        "BC": ["commerce"],
        "BB": ["business"],
        "AR": ["architecture"],
        "BD": ["design"],
        "AL": ["arts"],
        "BL": ["laws"],
        "BH": ["hotel"],
        "BS": ["sports"],
        "AC": ["acca"],
        "NU": ["nursing"],
        "CN": ["accountancy", "chartered"],
        "IA": ["accounting", "international"],
        "BN": ["analytics"],
        "MB": ["mba"],
        "MD": ["medicine"],
        "CA": ["computer applications"],
        "CS": ["computer science", "engineering"],
        "EC": ["electronics"],
        "EE": ["electrical"],
        "ME": ["mechanical"],
        "BT": ["biotechnology"],
        "CV": ["civil"]
    };
    
    for (const [code, keywordList] of Object.entries(keywords)) {
        for (const keyword of keywordList) {
            if (text.includes(keyword)) {
                return code;
            }
        }
    }
    
    return null;
}

/**
 * Resolve course code from profile using multiple strategies
 */
export function resolveCourseFromProfile(profile) {
    if (!profile) {
        return null;
    }
    
    // 1. Try profile.course if already set (from login handler)
    if (profile.course) {
        return profile.course;
    }
    
    // 2. Try fuzzy keyword matching
    const fuzzyMatch = resolveCourseByKeyword(profile);
    if (fuzzyMatch) {
        return fuzzyMatch;
    } else {}
}

function resolveSemesterFromProfile(profile) {
  if (!profile) return null;

  if (Number.isInteger(profile.current_semester)) {
    return profile.current_semester;
  }

  if (Number.isInteger(profile.semester)) {
    return profile.semester;
  }

  return null;
}

function resolveSemesterFromUsername(username) {
  const match = username.match(/^PES[1-2]UG(\d{2})[A-Z]{2}\d{3}$/i);
  if (!match) return null;

  const admissionYear = 2000 + Number(match[1]);
  const now = new Date();

  const yearsElapsed =
    now.getFullYear() - admissionYear -
    (now.getMonth() < 6 ? 1 : 0); // academic year rollover

  const semester = yearsElapsed * 2 + 1;

  return semester > 0 ? semester : null;
}

