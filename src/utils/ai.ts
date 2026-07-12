/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IssuePriority, AISuggested } from '../types';
import { db } from './db';

// Simple delay simulation to demonstrate clean UI loading, timeouts, and error handling states
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Hard safety rules for hazard keywords
const HAZARDS = [
  'electrical', 'gas', 'fire', 'smoke', 'sparks', 'exposed wire', 
  'medical', 'burning', 'shock', 'explosion', 'toxic', 'leakage gas', 'voltage'
];

interface RuleEntry {
  category: string;
  defaultPriority: IssuePriority;
  possibleCauses: string[];
  initialChecks: string[];
}

// Local rules dictionary for offline smart mapping
const RULES: { [key: string]: RuleEntry } = {
  ac: {
    category: 'HVAC / Cooling',
    defaultPriority: 'High',
    possibleCauses: [
      'Blocked drainage line',
      'Clogged or extremely dirty air filter',
      'Refrigerant gas leak',
      'Faulty compressor capacitor'
    ],
    initialChecks: [
      'Check if water is accumulating or dripping onto electrical components',
      'Verify the air filter is clear of heavy dust build-up',
      'Confirm the thermostat display is active and set below room temperature'
    ]
  },
  cooling: {
    category: 'HVAC / Cooling',
    defaultPriority: 'Medium',
    possibleCauses: [
      'Low refrigerant levels',
      'Thermostat sensor malfunction',
      'Obstructed external airflow vents'
    ],
    initialChecks: [
      'Confirm that air vents are unobstructed and open',
      'Verify if the external condenser fan is operating'
    ]
  },
  projector: {
    category: 'Display & Electronics',
    defaultPriority: 'Medium',
    possibleCauses: [
      'Damaged or loose HDMI/VGA adapter cable',
      'Projector lamp bulb reaching standard end-of-life hours',
      'Internal thermal sensor overheating, forcing auto-shutdown'
    ],
    initialChecks: [
      'Swap the input cable with a verified functional HDMI wire',
      'Check if the warning/thermal LED status light is flashing red',
      'Ensure exhaust fans are clear of dust and spinning freely'
    ]
  },
  flicker: {
    category: 'Display & Electronics',
    defaultPriority: 'Low',
    possibleCauses: [
      'Unstable power supply or loose mains connection',
      'Incompatible screen refresh rate on output device',
      'Video connector port degradation'
    ],
    initialChecks: [
      'Check physical snugness of cable ports on both the laptop and projector',
      'Try reducing laptop output resolution to 1080p'
    ]
  },
  generator: {
    category: 'Power & Infrastructure',
    defaultPriority: 'High',
    possibleCauses: [
      'Low starter battery voltage',
      'Contaminated fuel or fuel filter blockage',
      'Alternator winding fault'
    ],
    initialChecks: [
      'Verify battery voltage terminals are clean and tight',
      'Check current oil and fuel levels on physical gauges',
      'Look for active error codes or status flashing on generator panel'
    ]
  },
  power: {
    category: 'Power & Infrastructure',
    defaultPriority: 'High',
    possibleCauses: [
      'Tripped main circuit breaker',
      'Power supply unit overload',
      'Wall socket outlet failure'
    ],
    initialChecks: [
      'Check if adjacent devices in the room have lost utility electrical power',
      'Verify if GFI wall outlet reset button has tripped'
    ]
  },
  leak: {
    category: 'Plumbing & Liquid Control',
    defaultPriority: 'High',
    possibleCauses: [
      'Worn rubber gasket seal',
      'Corroded pipe coupling or joint crack',
      'Extreme high main supply line pressure'
    ],
    initialChecks: [
      'Locate and isolate the nearest main manual water shut-off valve',
      'Place a dry containment bucket underneath the active leak source',
      'Avoid touch or proximity to any nearby power outlets'
    ]
  },
  internet: {
    category: 'IT Networking',
    defaultPriority: 'Medium',
    possibleCauses: [
      'DHCP server IP address exhaustion',
      'Physical ethernet cable shear or patch panel dislodgement',
      'Local switchport configuration mismatch'
    ],
    initialChecks: [
      'Unplug and reconnect the device physical ethernet RJ-45 socket',
      'Confirm other network clients on the same hub can access the web',
      'Verify if device link light indicators are flashing yellow/green'
    ]
  },
  noise: {
    category: 'Mechanical / Vibration',
    defaultPriority: 'Medium',
    possibleCauses: [
      'Loose internal chassis mountings or dry bearings',
      'Debris trapped inside rotation fan blades',
      'Structural drive belt wear'
    ],
    initialChecks: [
      'Power down the machinery safely to inspect for visible external obstacles',
      'Note if sound is constant or rhythmic and louder at specific speeds'
    ]
  }
};

/**
 * AI Issue Triage Plug-and-Play interface
 * Analyzes complaints and yields structured JSON diagnostics.
 */
export async function getAITriage(complaintText: string, assetId?: string): Promise<AISuggested> {
  // Simulate active processing delay for authentic loading states
  await delay(700);

  const text = complaintText.toLowerCase();

  // 1. Scan for hard safety-hazard overrides
  const containsHazard = HAZARDS.some(h => text.includes(h));

  // 2. Extract matches from rules
  let category = 'General Maintenance';
  let priority: IssuePriority = 'Medium';
  const possibleCauses: string[] = [];
  const initialChecks: string[] = [];

  let matched = false;
  for (const [key, rule] of Object.entries(RULES)) {
    if (text.includes(key)) {
      category = rule.category;
      priority = rule.defaultPriority;
      possibleCauses.push(...rule.possibleCauses);
      initialChecks.push(...rule.initialChecks);
      matched = true;
    }
  }

  // Fallback defaults if no keywords matched
  if (!matched) {
    possibleCauses.push(
      'Undetermined component wear',
      'Operational environment misalignment',
      'Control module reset required'
    );
    initialChecks.push(
      'Visually inspect the physical unit for exterior stress or loose parts',
      'Verify stable power and network connectivity',
      'Consult the asset technical operation manual for manual resets'
    );
  }

  // Hazard Safety Injector
  if (containsHazard) {
    priority = 'Critical';
    category = 'Emergency Safety Hazard';
    possibleCauses.unshift('Electrical insulation compromise or thermal hot-spot ignition');
    initialChecks.unshift('❌ CRITICAL SAFETY: DO NOT TOUCH the unit. Isolate the power breaker if safe and contact emergency technicians immediately.');
  }

  // 3. Asset Repetitive Pattern History Check (AI Trend Analysis)
  let recurringPatternWarning: string | null = null;
  if (assetId) {
    const historicalIssues = db.getIssues().filter(i => i.assetId === assetId);
    
    // Check if there are similar categories/keywords in the past issues
    const matchCount = historicalIssues.filter(i => {
      const matchCat = i.category.toLowerCase().split(' ')[0];
      const currentFirstWord = category.toLowerCase().split(' ')[0];
      return matchCat === currentFirstWord || i.title.toLowerCase().includes(category.toLowerCase().split(' ')[0]);
    }).length;

    if (matchCount >= 2) {
      recurringPatternWarning = `⚠️ Asset Health Pattern: This asset has registered ${matchCount} similar ${category.split('/')[0].trim()} reports in its recent history, signaling potential structural fault.`;
    }
  }

  // Refine lists for clean array deduplication
  return {
    title: summarizeTitle(complaintText, category),
    category,
    priority,
    possibleCauses: Array.from(new Set(possibleCauses)).slice(0, 3),
    initialChecks: Array.from(new Set(initialChecks)).slice(0, 3),
    recurringPatternWarning,
  };
}

// Generate smart condensed title from complaint and category context
function summarizeTitle(text: string, category: string): string {
  if (text.length <= 40) return text;
  
  // Try to find key nouns or slice clean sentence
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  const sentences = capitalized.split(/[.!?]/);
  if (sentences[0].length > 10 && sentences[0].length <= 60) {
    return sentences[0];
  }
  
  return `Abnormal activity on ${category.split(' ')[0]} subsystem`;
}
