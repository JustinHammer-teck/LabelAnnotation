import { AviationIncident, AviationAnnotationData, DropdownCategory, DropdownOption } from '../types/aviation.types';

export const mockIncident: AviationIncident = {
  id: 1,
  task_id: 1,
  event_number: 'EVT-2024-001',
  event_description: 'Near miss incident involving commercial aircraft and drone during approach',
  date: '2024-01-15',
  time: '14:30:00',
  location: 'Denver International Airport',
  airport: 'KDEN',
  flight_phase: 'Approach',
};

export const mockAnnotation: AviationAnnotationData = {
  id: 1,
  annotation_id: 1,
  aircraft_type: '',
  event_labels: [],
  flight_phase: '',
  threat_type: {
    level1: null,
    level2: null,
    level3: null,
    fullPath: '',
  },
  threat_management: '',
  threat_outcome: '',
  threat_description: '',
  error_relevancy: '',
  error_type: {
    level1: null,
    level2: null,
    level3: null,
    fullPath: '',
  },
  error_management: '',
  error_outcome: '',
  error_description: '',
  uas_relevancy: '',
  uas_type: {
    level1: null,
    level2: null,
    level3: null,
    fullPath: '',
  },
  uas_management: '',
  uas_description: '',
  competency_indicators: [],
  likelihood: '',
  severity: '',
  training_benefit: '',
  crm_training_topics: [],
  training_plan_ideas: '',
  goals_to_achieve: '',
  notes: '',
};

const createOption = (id: number, code: string, label: string, level: 1 | 2 | 3, parent_id: number | null = null): DropdownOption => ({
  id,
  code,
  label,
  level,
  parent_id,
  children: [],
});

export const mockDropdownOptions: DropdownCategory = {
  aircraft: [
    createOption(1, 'B737', 'Boeing 737', 1),
    createOption(2, 'A320', 'Airbus A320', 1),
    createOption(3, 'B777', 'Boeing 777', 1),
  ],
  threat: [
    { ...createOption(10, 'ENV', 'Environmental', 1), children: [
      createOption(11, 'ENV-WX', 'Weather', 2, 10),
      createOption(12, 'ENV-TERR', 'Terrain', 2, 10),
    ]},
    { ...createOption(20, 'TECH', 'Technical', 1), children: [
      createOption(21, 'TECH-SYS', 'System Failure', 2, 20),
      createOption(22, 'TECH-EQP', 'Equipment Malfunction', 2, 20),
    ]},
  ],
  error: [
    { ...createOption(30, 'PROC', 'Procedural', 1), children: [
      createOption(31, 'PROC-SOP', 'SOP Deviation', 2, 30),
      createOption(32, 'PROC-CHK', 'Checklist Error', 2, 30),
    ]},
    { ...createOption(40, 'COMM', 'Communication', 1), children: [
      createOption(41, 'COMM-ATC', 'ATC Communication', 2, 40),
      createOption(42, 'COMM-CREW', 'Crew Communication', 2, 40),
    ]},
  ],
  uas: [
    { ...createOption(50, 'UAS-COMM', 'Commercial UAS', 1), children: [
      createOption(51, 'UAS-COMM-DJI', 'DJI', 2, 50),
      createOption(52, 'UAS-COMM-PARROT', 'Parrot', 2, 50),
    ]},
    { ...createOption(60, 'UAS-MIL', 'Military UAS', 1), children: [
      createOption(61, 'UAS-MIL-PRED', 'Predator', 2, 60),
    ]},
  ],
  event_labels: [
    createOption(70, 'CRITICAL', 'Critical Event', 1),
    createOption(71, 'MAJOR', 'Major Event', 1),
    createOption(72, 'MINOR', 'Minor Event', 1),
  ],
  competency: [
    createOption(80, 'COMP-TECH', 'Technical Skills', 1),
    createOption(81, 'COMP-DEC', 'Decision Making', 1),
    createOption(82, 'COMP-COMM', 'Communication', 1),
    createOption(83, 'COMP-LEAD', 'Leadership', 1),
  ],
  crm_topics: [
    createOption(90, 'CRM-TW', 'Teamwork', 1),
    createOption(91, 'CRM-SA', 'Situational Awareness', 1),
    createOption(92, 'CRM-DM', 'Decision Making', 1),
    createOption(93, 'CRM-COMM', 'Communication', 1),
  ],
  flight_phases: [
    createOption(100, 'TAXI', 'Taxi', 1),
    createOption(101, 'TAKEOFF', 'Takeoff', 1),
    createOption(102, 'CLIMB', 'Climb', 1),
    createOption(103, 'CRUISE', 'Cruise', 1),
    createOption(104, 'DESCENT', 'Descent', 1),
    createOption(105, 'APPROACH', 'Approach', 1),
    createOption(106, 'LANDING', 'Landing', 1),
  ],
  threat_management: [
    createOption(110, 'TM-AVOID', 'Avoided', 1),
    createOption(111, 'TM-MITIG', 'Mitigated', 1),
    createOption(112, 'TM-UNMAN', 'Unmanaged', 1),
  ],
  threat_outcome: [
    createOption(120, 'TO-NONE', 'No Effect', 1),
    createOption(121, 'TO-ADD', 'Additional Error', 1),
    createOption(122, 'TO-UND', 'Undesired State', 1),
  ],
  error_relevancy: [
    createOption(130, 'ER-REL', 'Relevant', 1),
    createOption(131, 'ER-NREL', 'Not Relevant', 1),
  ],
  error_management: [
    createOption(140, 'EM-CATCH', 'Caught/Corrected', 1),
    createOption(141, 'EM-INCON', 'Inconsequential', 1),
    createOption(142, 'EM-UNMAN', 'Unmanaged', 1),
  ],
  error_outcome: [
    createOption(150, 'EO-NONE', 'No Effect', 1),
    createOption(151, 'EO-ADD', 'Additional Error', 1),
    createOption(152, 'EO-UND', 'Undesired State', 1),
  ],
  uas_relevancy: [
    createOption(160, 'UR-REL', 'Relevant', 1),
    createOption(161, 'UR-NREL', 'Not Relevant', 1),
  ],
  uas_management: [
    createOption(170, 'UM-AVOID', 'Avoided', 1),
    createOption(171, 'UM-MITIG', 'Mitigated', 1),
    createOption(172, 'UM-UNMAN', 'Unmanaged', 1),
  ],
  likelihood: [
    createOption(180, 'L-RARE', 'Rare', 1),
    createOption(181, 'L-UNLIKELY', 'Unlikely', 1),
    createOption(182, 'L-POSSIBLE', 'Possible', 1),
    createOption(183, 'L-LIKELY', 'Likely', 1),
    createOption(184, 'L-CERTAIN', 'Almost Certain', 1),
  ],
  severity: [
    createOption(190, 'S-NEG', 'Negligible', 1),
    createOption(191, 'S-MIN', 'Minor', 1),
    createOption(192, 'S-MOD', 'Moderate', 1),
    createOption(193, 'S-MAJ', 'Major', 1),
    createOption(194, 'S-CAT', 'Catastrophic', 1),
  ],
  training_benefit: [
    createOption(200, 'TB-LOW', 'Low', 1),
    createOption(201, 'TB-MED', 'Medium', 1),
    createOption(202, 'TB-HIGH', 'High', 1),
  ],
};
