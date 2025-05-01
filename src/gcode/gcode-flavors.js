/**
 * GCode Flavor Definitions
 * 
 * This file defines different GCode flavors for various machine controllers.
 * Each flavor includes syntax, commands, and other specifics for that controller.
 */

/**
 * GRBL Flavor - Common for hobby CNC machines
 */
const GRBL_FLAVOR = {
  name: 'GRBL',
  syntax: {
    commentStart: '(',
    commentEnd: ')',
    blockDelete: '/',    // Optional block delete character
    variablePrefix: '#'  // For parametric programming
  },
  commands: {
    rapidMove: 'G0',
    linearMove: 'G1',
    arcMoveCW: 'G2',
    arcMoveCCW: 'G3',
    dwell: 'G4',
    useMillimeters: 'G21',
    useInches: 'G20',
    absolutePositioning: 'G90',
    relativePositioning: 'G91',
    startSpindle: 'M3',
    stopSpindle: 'M5',
    spindleCW: 'M3',
    spindleCCW: 'M4',
    coolantOn: 'M8',
    coolantOff: 'M9',
    programEnd: 'M2'
  },
  features: {
    supportsArcs: true,
    supportsSpindleSpeed: true,
    supportsCoolant: true,
    supportsToolChanges: false,
    maxLineLength: 50  // Maximum recommended line length
  }
};

/**
 * Marlin Flavor - Common for 3D printers but also used in some CNC applications
 */
const MARLIN_FLAVOR = {
  name: 'Marlin',
  syntax: {
    commentStart: ';',
    commentEnd: '',
    blockDelete: '',
    variablePrefix: '#'
  },
  commands: {
    rapidMove: 'G0',
    linearMove: 'G1',
    arcMoveCW: 'G2',
    arcMoveCCW: 'G3',
    dwell: 'G4',
    useMillimeters: 'G21',
    useInches: 'G20',
    absolutePositioning: 'G90',
    relativePositioning: 'G91',
    startSpindle: 'M3',
    stopSpindle: 'M5',
    spindleCW: 'M3',
    spindleCCW: 'M4',
    coolantOn: 'M8',
    coolantOff: 'M9',
    programEnd: 'M2'
  },
  features: {
    supportsArcs: true,
    supportsSpindleSpeed: true,
    supportsCoolant: true,
    supportsToolChanges: false,
    maxLineLength: 96
  }
};

/**
 * Mach3 Flavor - Common for Windows-based CNC controllers
 */
const MACH3_FLAVOR = {
  name: 'Mach3',
  syntax: {
    commentStart: '(',
    commentEnd: ')',
    blockDelete: '/',
    variablePrefix: '#'
  },
  commands: {
    rapidMove: 'G0',
    linearMove: 'G1',
    arcMoveCW: 'G2',
    arcMoveCCW: 'G3',
    dwell: 'G4',
    useMillimeters: 'G21',
    useInches: 'G20',
    absolutePositioning: 'G90',
    relativePositioning: 'G91',
    startSpindle: 'M3',
    stopSpindle: 'M5',
    spindleCW: 'M3',
    spindleCCW: 'M4',
    coolantOn: 'M8',
    coolantOff: 'M9',
    programEnd: 'M30'  // Mach3 uses M30 by default
  },
  features: {
    supportsArcs: true,
    supportsSpindleSpeed: true,
    supportsCoolant: true,
    supportsToolChanges: true,
    maxLineLength: 256
  }
};

/**
 * Fanuc Flavor - Common for industrial CNC machines
 */
const FANUC_FLAVOR = {
  name: 'Fanuc',
  syntax: {
    commentStart: '(',
    commentEnd: ')',
    blockDelete: '/',
    variablePrefix: '#'
  },
  commands: {
    rapidMove: 'G00',  // Fanuc often uses G00 instead of G0
    linearMove: 'G01', // Fanuc often uses G01 instead of G1
    arcMoveCW: 'G02',
    arcMoveCCW: 'G03',
    dwell: 'G04',
    useMillimeters: 'G21',
    useInches: 'G20',
    absolutePositioning: 'G90',
    relativePositioning: 'G91',
    startSpindle: 'M03',
    stopSpindle: 'M05',
    spindleCW: 'M03',
    spindleCCW: 'M04',
    coolantOn: 'M08',
    coolantOff: 'M09',
    programEnd: 'M30'
  },
  features: {
    supportsArcs: true,
    supportsSpindleSpeed: true,
    supportsCoolant: true,
    supportsToolChanges: true,
    maxLineLength: 256
  }
};

/**
 * LinuxCNC Flavor (formally EMC2)
 */
const LINUXCNC_FLAVOR = {
  name: 'LinuxCNC',
  syntax: {
    commentStart: ';',
    commentEnd: '',
    blockDelete: '/',
    variablePrefix: '#'
  },
  commands: {
    rapidMove: 'G0',
    linearMove: 'G1',
    arcMoveCW: 'G2',
    arcMoveCCW: 'G3',
    dwell: 'G4',
    useMillimeters: 'G21',
    useInches: 'G20',
    absolutePositioning: 'G90',
    relativePositioning: 'G91',
    startSpindle: 'M3',
    stopSpindle: 'M5',
    spindleCW: 'M3',
    spindleCCW: 'M4',
    coolantOn: 'M8',
    coolantOff: 'M9',
    programEnd: 'M2'
  },
  features: {
    supportsArcs: true,
    supportsSpindleSpeed: true,
    supportsCoolant: true,
    supportsToolChanges: true,
    maxLineLength: 256
  }
};

module.exports = {
  GRBL_FLAVOR,
  MARLIN_FLAVOR,
  MACH3_FLAVOR,
  FANUC_FLAVOR,
  LINUXCNC_FLAVOR
}; 