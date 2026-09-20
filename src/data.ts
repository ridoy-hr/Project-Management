import { Project, Task, User, AIMemoryNote, Portfolio, Goal, Team, ProjectTemplate } from './types';

export const initialTemplates: ProjectTemplate[] = [
  {
    id: 'tpl1',
    name: 'Website Redesign',
    description: 'A standard framework for updating website UI, content, and development.',
    icon: 'Layout',
    color: 'bg-blue-500',
    tasks: [
      { title: 'Define project scope and goals', status: 'To Do', priority: 'High', sectionName: 'Planning' },
      { title: 'Create wireframes', status: 'To Do', priority: 'Medium', sectionName: 'Design' },
      { title: 'Approve mockups', status: 'To Do', priority: 'High', sectionName: 'Design' },
      { title: 'Develop frontend components', status: 'To Do', priority: 'Medium', sectionName: 'Development' },
      { title: 'Conduct user testing', status: 'To Do', priority: 'High', sectionName: 'Testing' }
    ]
  },
  {
    id: 'tpl2',
    name: 'New Employee Onboarding',
    description: 'Ensure a smooth transition for new hires with this comprehensive onboarding template.',
    icon: 'Users',
    color: 'bg-green-500',
    tasks: [
      { title: 'Set up IT equipment and accounts', status: 'To Do', priority: 'High', sectionName: 'Pre-boarding' },
      { title: 'Welcome lunch & office tour', status: 'To Do', priority: 'Low', sectionName: 'Day 1' },
      { title: 'Role-specific training session', status: 'To Do', priority: 'Medium', sectionName: 'Week 1' },
      { title: '30-day check-in', status: 'To Do', priority: 'Medium', sectionName: 'Month 1' }
    ]
  },
  {
    id: 'tpl3',
    name: 'Marketing Campaign Launch',
    description: 'Coordinate cross-functional marketing efforts for a product or service launch.',
    icon: 'Rocket',
    color: 'bg-purple-500',
    tasks: [
      { title: 'Finalize campaign strategy and budget', status: 'To Do', priority: 'High', sectionName: 'Strategy' },
      { title: 'Draft social media copy and graphics', status: 'To Do', priority: 'Medium', sectionName: 'Content' },
      { title: 'Launch email marketing sequence', status: 'To Do', priority: 'High', sectionName: 'Execution' },
      { title: 'Analyze campaign performance', status: 'To Do', priority: 'Medium', sectionName: 'Review' }
    ]
  }
];

export const users: User[] = [
  { id: 'u1', name: 'Mahbub Ridoy', initials: 'MR', avatarUrl: '/images/dan.jpg', role: 'admin' },
  { id: 'u-yamuna', name: 'Yamuna Saravanan', initials: 'YS', avatarUrl: '/images/yamuna.jpg', role: 'member' },
  { id: 'u-mosaddeka', name: 'Mosaddeka Khatun', initials: 'MK', avatarUrl: '/images/mosaddeka.jpg', role: 'member' },
  { id: 'u2', name: 'Cathy Keeler', initials: 'CK', avatarUrl: '/images/kent.jpg', role: 'member' },
  { id: 'u3', name: 'Shelley Marsland', initials: 'SM', avatarUrl: '/images/cat_img.png', role: 'member' },
  { id: 'u4', name: 'Alex Morgan', initials: 'AM', role: 'member' },
  { id: 'u5', name: 'Sue Kelley', initials: 'SK', avatarUrl: '/images/kent.jpg', role: 'member' },
  { id: 'u6', name: 'Diane Muego', initials: 'DM', avatarUrl: '/images/cat_img.png', role: 'member' },
  { id: 'u7', name: 'Danna R.', initials: 'DR', role: 'member' },
  { id: 'u8', name: 'Mark S.', initials: 'MS', role: 'member' },
];

export const projects: Project[] = [
  { 
    id: 'p0', 
    name: 'SOI 2026-11-10 Employee Retention', 
    color: 'bg-[#F25C54]', 
    isPublic: true, 
    ownerId: 'u1',
    description: 'State of the Industry (SOI) Research, Advisory Board Meetings, Webcast Preparation, and Executive Deliverables for Employee Retention.',
    health: 'On Track',
    statusUpdate: 'Advisory Board Meeting #2 scheduled with presentation deck in preparation.',
    isStarred: true,
    sections: [
      { id: 'sec-jul-sept-2026', projectId: 'p0', name: 'July-Sept 2026', order: 1 },
      { id: 'sec-jan-june-2026', projectId: 'p0', name: 'Jan-June 2026', order: 2 },
      { id: 'sec-oct-dec-2026', projectId: 'p0', name: 'Oct-Dec 2026', order: 3 },
    ]
  },
  { 
    id: 'p1', 
    name: 'Website Redesign', 
    color: 'bg-mp-blue-500', 
    isPublic: true, 
    ownerId: 'u1',
    description: 'Core web experience redesign focused on enterprise accessibility, speed, and design systems.',
    health: 'On Track',
    statusUpdate: 'Phase 1 wireframes and navigation architecture in validation. Approvals underway.',
    sections: [
      { id: 'sec-p1-core', projectId: 'p1', name: 'Core Infrastructure & UX', order: 1 },
      { id: 'sec-p1-qa', projectId: 'p1', name: 'Testing & Rollout', order: 2 }
    ]
  },
  { 
    id: 'p2', 
    name: 'Mobile App Launch', 
    color: 'bg-mp-green-500', 
    isPublic: true, 
    ownerId: 'u2',
    description: 'Native mobile companion app for iOS & Android with offline task caching.',
    health: 'On Track',
    statusUpdate: 'Beta build delivered to internal testers.'
  },
  { 
    id: 'p3', 
    name: 'Marketing Campaign', 
    color: 'bg-alert-text', 
    isPublic: false, 
    ownerId: 'u3',
    description: 'Q3 product awareness campaign across direct channels, webcasts, and partner showcases.',
    health: 'At Risk',
    statusUpdate: 'Design asset turnaround blocked on creative review.'
  },
  { 
    id: 'p4', 
    name: '2027-01-27_ Future of Talent AcquisitionVE', 
    color: 'bg-indigo-500', 
    isPublic: true, 
    ownerId: 'u1',
    description: 'Global virtual summit on AI recruiting and candidate journey innovations.',
    health: 'On Track',
    statusUpdate: 'Keynote speakers confirmed. Registration forms live.'
  },
  { 
    id: 'p5', 
    name: 'Webcast & Event Email Calendar', 
    color: 'bg-teal-500', 
    isPublic: true, 
    ownerId: 'u3',
    description: 'Weekly schedule of lead-nurturing events, attendee follow-ups, and engagement trackers.',
    health: 'On Track',
    statusUpdate: 'Email sequences scheduled for next 4 weeks.'
  },
  { 
    id: 'p6', 
    name: '2027-01-20_HR Demo Day_VE', 
    color: 'bg-purple-500', 
    isPublic: true, 
    ownerId: 'u2',
    description: 'Live vendor demonstrations and enterprise buyer evaluations.',
    health: 'On Track',
    statusUpdate: 'Demo booth allocation finalized.'
  },
];

export const initialTasks: Task[] = [
  // July-Sept 2026 Section Tasks (from screenshot)
  {
    id: 't-ccm-col',
    title: 'Discuss: CCM column changes in relation to changes in HR SOP',
    status: 'To Do',
    priority: 'High',
    assigneeId: 'u-yamuna',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-08-26',
    dependencyIds: [],
    collaboratorIds: ['u-yamuna', 'u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-rr-pdf',
    title: 'Research Report PDF',
    status: 'Done',
    priority: 'Medium',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-08-14',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-video-tpl-12',
    title: 'Video Template 12',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u-mosaddeka',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-09-09',
    dependencyIds: [],
    collaboratorIds: ['u-mosaddeka'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-pm-dates',
    title: 'PM to add dates and timeline for Q4 deliverables',
    status: 'To Do',
    priority: 'High',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-09-14',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-shortlist-team',
    title: 'Shortlist all new team members (on hold)',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u-yamuna',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-08-17',
    dependencyIds: [],
    collaboratorIds: ['u-yamuna', 'u1'],
    isPrivate: false,
    subtasks: [],
    comments: [
      { id: 'c-shortlist-1', text: 'HR team awaiting final candidate shortlist approval.', createdAt: '2026-08-16T10:00:00Z', userId: 'u-yamuna' }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-2027-sched',
    title: '2027 Research schedule',
    status: 'Done',
    priority: 'Medium',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-09-04',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    attachments: [
      { id: 'att-2027-1', name: '2027_Research_Schedule_v2.pdf', size: 340000, type: 'pdf', createdAt: '2026-09-04T12:00:00Z' }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-weekly-ridoy',
    title: 'Weekly Ridoy meeting',
    status: 'To Do',
    priority: 'Low',
    assigneeId: 'u-yamuna',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-07-29',
    dependencyIds: [],
    collaboratorIds: ['u-yamuna'],
    isPrivate: false,
    subtasks: [],
    comments: [
      { id: 'c-weekly-1', text: 'Agenda review and action item sync.', createdAt: '2026-07-28T11:00:00Z', userId: 'u-yamuna' }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-staff-jul21',
    title: 'July 21 - Staff Meeting',
    status: 'Done',
    priority: 'Low',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-07-27',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-staff-aug18',
    title: 'August 18 - Staff Meeting',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-09-14',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-1min-video',
    title: '1-minute videos creation, scheduling, strategy',
    status: 'To Do',
    priority: 'High',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-08-04',
    dependencyIds: [],
    collaboratorIds: ['u-mosaddeka'],
    isPrivate: false,
    comments: [
      { id: 'c-vid-1', text: 'Storyboard drafts ready for video editors.', createdAt: '2026-08-03T09:00:00Z', userId: 'u-mosaddeka' }
    ],
    attachments: [
      { id: 'att-vid-1', name: 'Video_Strategy_Outline.pdf', size: 180000, type: 'pdf', createdAt: '2026-08-02T10:00:00Z' },
      { id: 'att-vid-2', name: 'Motion_Graphics_Brief.docx', size: 95000, type: 'docx', createdAt: '2026-08-03T14:00:00Z' }
    ],
    subtasks: [
      { id: 'sub-vid-1', title: 'Script writing & approvals', isCompleted: true },
      { id: 'sub-vid-2', title: 'Voiceover recording & animation', isCompleted: false },
      { id: 'sub-vid-3', title: 'Social media distribution calendar', isCompleted: false }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-amazon-winner',
    title: 'Select Amazon winner - Compensation survey',
    status: 'Done',
    priority: 'Medium',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-07-30',
    dependencyIds: [],
    collaboratorIds: ['u1', 'u-yamuna'],
    isPrivate: false,
    subtasks: [],
    comments: [
      { id: 'c-amz-1', text: 'Drawing executed using random participant ID script.', createdAt: '2026-07-30T15:00:00Z', userId: 'u1' },
      { id: 'c-amz-2', text: 'Winner notified and gift card issued via email.', createdAt: '2026-07-31T10:00:00Z', userId: 'u-yamuna' }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-sales-jul9',
    title: 'July 9 Product/Sales meeting - follow-up/next steps',
    status: 'Done',
    priority: 'Low',
    assigneeId: 'u1',
    sectionId: 'sec-jul-sept-2026',
    projectIds: ['p0'],
    dueDate: '2026-07-27',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },

  // Jan-June 2026 Section Tasks (from screenshot)
  {
    id: 't-survey-id-cust',
    title: 'Survey ID Custom Research update',
    status: 'Done',
    priority: 'Medium',
    assigneeId: 'u1',
    sectionId: 'sec-jan-june-2026',
    projectIds: ['p0'],
    dueDate: '2026-08-17',
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-intro-outro',
    title: 'Adding intro and outro to the video',
    status: 'Done',
    priority: 'Low',
    assigneeId: 'u-mosaddeka',
    sectionId: 'sec-jan-june-2026',
    projectIds: ['p0'],
    dueDate: undefined,
    dependencyIds: [],
    collaboratorIds: ['u-mosaddeka'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-staff-meeting-agenda',
    title: 'Staff Meeting agenda for Research (3rd Tuesday)',
    status: 'To Do',
    priority: 'High',
    isMilestone: true,
    assigneeId: undefined,
    sectionId: 'sec-jan-june-2026',
    projectIds: ['p0'],
    dueDate: undefined,
    dependencyIds: [],
    collaboratorIds: ['u1', 'u-yamuna', 'u-mosaddeka'],
    isPrivate: false,
    subtasks: [],
    comments: [
      { id: 'c-res-1', text: 'Q2 Research findings recap', createdAt: '2026-05-02T10:00:00Z', userId: 'u1' },
      { id: 'c-res-2', text: 'Advisory council feedback', createdAt: '2026-05-03T11:00:00Z', userId: 'u-yamuna' },
      { id: 'c-res-3', text: 'Upcoming webcast dates', createdAt: '2026-05-04T12:00:00Z', userId: 'u-mosaddeka' },
      { id: 'c-res-4', text: 'Executive summary distribution', createdAt: '2026-05-05T09:00:00Z', userId: 'u1' },
      { id: 'c-res-5', text: 'Action items confirmed', createdAt: '2026-05-06T14:00:00Z', userId: 'u2' },
      { id: 'c-res-6', text: 'Meeting minutes circulated', createdAt: '2026-05-07T08:00:00Z', userId: 'u3' },
      { id: 'c-res-7', text: 'Follow-up sync set for next month', createdAt: '2026-05-08T16:00:00Z', userId: 'u1' }
    ],
    attachments: [
      { id: 'att-res-1', name: 'Staff_Meeting_Agenda_Research.pdf', size: 210000, type: 'pdf', createdAt: '2026-05-02T09:00:00Z' }
    ],
    auditLogs: [],
    customFields: {}
  },

  // Advisory Board Meeting #2 Tasks
  {
    id: 't-soi-1',
    title: 'AB Meeting #2 - SETP 24',
    status: 'To Do',
    priority: 'High',
    isMilestone: true,
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-24',
    dependencyIds: [],
    collaboratorIds: ['u5', 'u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-2',
    title: 'Send Mtg #2 Reminder and Discussion question',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u1', // Kent Keeler (Due Today)
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-14',
    dependencyIds: [],
    collaboratorIds: ['u1', 'u5'],
    isPrivate: false,
    subtasks: [
      { id: 'sub-m2-1', title: 'Draft discussion agenda', isCompleted: true },
      { id: 'sub-m2-2', title: 'Confirm RSVP count with Diane', isCompleted: false },
    ],
    comments: [
      { id: 'c-soi-1', text: 'Meeting room link has been generated in Google Meet.', createdAt: '2026-09-13T10:00:00Z', userId: 'u5' }
    ],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-3',
    title: 'Update "Snapshot" slide',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u1', // Kent Keeler (Next week)
    sectionId: 'sec-ab2',
    projectIds: ['p0', 'p1'],
    dueDate: '2026-09-19',
    dependencyIds: [],
    collaboratorIds: ['u1', 'u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-4',
    title: 'AB#2 Google Meeting Notes & Transcript',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u5', // Sue Kelley
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-25',
    dependencyIds: [],
    collaboratorIds: ['u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-5',
    title: 'Send email after Meeting #2 with follow-up items',
    status: 'To Do',
    priority: 'High',
    assigneeId: 'u6', // Diane Muego
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-24',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-6',
    title: 'Send finalized AB list to Danna to paste into report',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u5', // Sue Kelley
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-25',
    dependencyIds: [],
    collaboratorIds: ['u5', 'u7'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-7',
    title: 'AB panel to present at Virtual Event TBD',
    status: 'To Do',
    priority: 'Medium',
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dependencyIds: [],
    collaboratorIds: ['u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-8',
    title: 'Recommend AB presenters to Mark for research webcast',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u5', // Sue Kelley
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-25',
    dependencyIds: [],
    collaboratorIds: ['u5', 'u8'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-9',
    title: 'AB member quote request/approvals (if applicable)',
    status: 'To Do',
    priority: 'Low',
    assigneeId: 'u5', // Sue Kelley
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-09-25',
    dependencyIds: [],
    collaboratorIds: ['u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-10',
    title: 'Send last minute reminder to AB\'s to sign up for VE',
    status: 'To Do',
    priority: 'High',
    assigneeId: 'u6', // Diane Muego
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-11-08',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-11',
    title: 'VIRTUAL EVENT DATE - MMM DD',
    status: 'To Do',
    priority: 'High',
    isMilestone: true,
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-11-10',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-12',
    title: 'Send TY and NPS Survey to Co-Presenter',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u5', // Sue Kelley
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-11-11',
    dependencyIds: [],
    collaboratorIds: ['u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-13',
    title: 'Send All Sponsor RR PDF to each AB member',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u6', // Diane Muego
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-11-11',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-14',
    title: 'Send All Sponsor INFOGRAPHIC PDF to each AB member',
    status: 'To Do',
    priority: 'Medium',
    assigneeId: 'u6', // Diane Muego
    sectionId: 'sec-ab2',
    projectIds: ['p0'],
    dueDate: '2026-11-17',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  // Advisory Board Meeting #1 Tasks
  {
    id: 't-soi-ab1-1',
    title: 'AB Meeting #1 Intro & Objective Overview',
    status: 'Done',
    priority: 'High',
    assigneeId: 'u5',
    sectionId: 'sec-ab1',
    projectIds: ['p0'],
    dueDate: '2026-08-15',
    dependencyIds: [],
    collaboratorIds: ['u5'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  {
    id: 't-soi-ab1-2',
    title: 'Compile initial participant feedback and roster',
    status: 'Done',
    priority: 'Medium',
    assigneeId: 'u6',
    sectionId: 'sec-ab1',
    projectIds: ['p0'],
    dueDate: '2026-08-18',
    dependencyIds: [],
    collaboratorIds: ['u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  // Survey Section Task
  {
    id: 't-soi-sur-1',
    title: 'Draft Employee Retention Survey Questionnaire v1',
    status: 'To Do',
    priority: 'High',
    assigneeId: 'u6',
    sectionId: 'sec-survey',
    projectIds: ['p0'],
    dueDate: '2026-09-30',
    dependencyIds: [],
    collaboratorIds: ['u5', 'u6'],
    isPrivate: false,
    subtasks: [],
    comments: [],
    auditLogs: [],
    customFields: {}
  },
  { 
    id: 't1', 
    title: 'Design Homepage wireframes & visual guidelines', 
    description: 'Establish the core layout, spacing system, and visual elements for the new HR portal redesign.',
    status: 'Done', 
    priority: 'High', 
    assigneeId: 'u1', 
    projectIds: ['p1', 'p3'], 
    dueDate: '2026-05-15', 
    dependencyIds: [],
    collaboratorIds: ['u1', 'u2'],
    isPrivate: true,
    attachments: [
      { id: 'a1', name: 'design-spec-v1.pdf', size: 2400000, type: 'application/pdf', createdAt: '2026-05-10T10:00:00Z' }
    ],
    subtasks: [
      { id: 's1', title: 'Desktop layout responsive grid', isCompleted: true },
      { id: 's2', title: 'Dark mode palette contrast check', isCompleted: false },
    ], 
    comments: [], 
    auditLogs: [{ id: 'l1', text: 'Task created', createdAt: '2026-05-09T09:00:00Z' }], 
    customFields: {} 
  },
  { 
    id: 't2', 
    title: 'Implement OAuth & Workspace Authentication', 
    description: 'Configure multi-provider login, session caching, and token validation.',
    status: 'To Do', 
    priority: 'Medium', 
    assigneeId: 'u1', 
    projectIds: ['p1'], 
    dueDate: '2026-05-20', 
    dependencyIds: ['t1'],
    collaboratorIds: ['u2', 'u3'],
    isPrivate: false,
    attachments: [],
    subtasks: [
      { id: 's3', title: 'Setup session tokens', isCompleted: false }
    ], 
    comments: [], 
    auditLogs: [], 
    customFields: {} 
  },
  { 
    id: 't3', 
    title: 'Email 6 Send Weekly VE Email (Talent Acquisition)', 
    description: 'Coordinate copy review with recruitment stakeholders and schedule blast.',
    status: 'Review', 
    priority: 'Medium', 
    assigneeId: 'u3', 
    projectIds: ['p4', 'p5'], 
    dueDate: '2027-01-19', 
    dependencyIds: [],
    collaboratorIds: ['u1', 'u3'],
    isPrivate: true,
    attachments: [],
    subtasks: [], 
    comments: [], 
    auditLogs: [], 
    customFields: {} 
  },
  { 
    id: 't4', 
    title: 'Email 6 Create Weekly VE Email (HR Demo Day)', 
    status: 'Done', 
    priority: 'Low', 
    assigneeId: 'u1', 
    projectIds: ['p5', 'p6'], 
    dueDate: '2027-01-13', 
    dependencyIds: [],
    collaboratorIds: ['u1'],
    isPrivate: true,
    attachments: [],
    subtasks: [], 
    comments: [], 
    auditLogs: [], 
    customFields: {} 
  },
  { 
    id: 't5', 
    title: 'Pull vendors from competitive live events and tag list', 
    status: 'To Do', 
    priority: 'Medium', 
    assigneeId: 'u2', 
    projectIds: ['p4'], 
    dueDate: '2026-07-11', 
    dependencyIds: ['t1'],
    collaboratorIds: ['u2', 'u1'],
    isPrivate: false,
    attachments: [],
    subtasks: [], 
    comments: [], 
    auditLogs: [], 
    customFields: {} 
  },
  { 
    id: 't6', 
    title: 'Participant survey distribution & NPS analysis', 
    status: 'To Do', 
    priority: 'Low', 
    assigneeId: 'u3', 
    projectIds: ['p1', 'p2'], 
    dueDate: '2026-06-01', 
    dependencyIds: [],
    collaboratorIds: ['u3'],
    isPrivate: true,
    attachments: [],
    subtasks: [], 
    comments: [], 
    auditLogs: [], 
    customFields: {} 
  },
];

export const initialMemories: AIMemoryNote[] = [
  {
    id: 'm1',
    title: 'Peak Productivity Pattern Detected',
    category: 'workflow',
    content: 'Mahbub completes 78% of high-priority tasks between 9:30 AM and 1:00 PM. High focus work like "Design Homepage wireframes" moves quickest on Tuesdays and Thursdays.',
    tags: ['Productivity', 'Peak Hours', 'Workflow'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isPinned: true
  },
  {
    id: 'm2',
    title: 'Cross-Project Dependency Bottleneck: Talent Acquisition',
    category: 'insight',
    content: 'Email campaign launches for "2027-01-27_ Future of Talent AcquisitionVE" are frequently blocked until vendor data tagging finishes. Consider assigning vendor scrape tasks 3 days earlier.',
    tags: ['Bottlenecks', 'Talent Acquisition', 'Scheduling'],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    isPinned: true
  },
  {
    id: 'm3',
    title: 'Recurring Collaboration Synergy: Cathy & Shelley',
    category: 'decision',
    content: 'Cathy Keeler and Shelley Marsland have co-authored 14 task updates this week across email webcast campaigns. Tasks with both assigned close 35% faster than average.',
    tags: ['Teamwork', 'Communication', 'Email Campaigns'],
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    isPinned: false
  },
  {
    id: 'm4',
    title: 'Actionable Note: Q3 Milestone Alignment Required',
    category: 'recommendation',
    content: '3 tasks in Website Redesign have impending deadlines within the next 7 days without explicit subtasks. Generating breakdown recommendations automatically.',
    tags: ['Recommendations', 'Deadlines', 'Roadmap'],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isPinned: false
  }
];

export const initialPortfolios: Portfolio[] = [
  {
    id: 'port1',
    name: 'Q3 Enterprise Product Roadmap',
    description: 'High-visibility strategic initiatives across mobile, responsive web design, and developer authentication.',
    projectIds: ['p1', 'p2'],
    ownerId: 'u1',
    color: 'bg-mp-blue-500'
  },
  {
    id: 'port2',
    name: 'Growth & Virtual Conferences 2027',
    description: 'Global virtual summits, webcast nurture sequences, and enterprise HR demo day events.',
    projectIds: ['p4', 'p5', 'p6'],
    ownerId: 'u2',
    color: 'bg-indigo-500'
  }
];

export const initialGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Deliver Unified Web Portal Redesign v2.0',
    description: 'Complete high-fidelity design standards, accessibility pass, and design system tokens.',
    ownerId: 'u1',
    timeframe: 'Q3 2026',
    progress: 68,
    targetMetric: '100% Launch Ready',
    currentMetric: '68% Completed',
    health: 'On Track',
    linkedProjectIds: ['p1']
  },
  {
    id: 'g2',
    title: 'Acquire 5,000 Verified Summit Registrations',
    description: 'Drive multi-channel email campaigns and webcast lead funnels for Future of Talent summit.',
    ownerId: 'u3',
    timeframe: 'Jan 2027',
    progress: 45,
    targetMetric: '5,000 Attendees',
    currentMetric: '2,250 Registered',
    health: 'On Track',
    linkedProjectIds: ['p4', 'p5']
  },
  {
    id: 'g3',
    title: 'Ship Beta App with Offline Resilience',
    description: 'Provide field recruiters and HR teams offline-first mobile sync capabilities.',
    ownerId: 'u2',
    timeframe: 'Q4 2026',
    progress: 82,
    targetMetric: 'Zero Critical Crashes',
    currentMetric: 'Beta Active',
    health: 'On Track',
    linkedProjectIds: ['p2']
  }
];

export const initialTeams: Team[] = [
  {
    id: 'tm1',
    name: 'Product & Design',
    description: 'Core product architecture, user research, interaction design, and design systems.',
    memberIds: ['u1', 'u2'],
    iconColor: 'bg-mp-blue-500'
  },
  {
    id: 'tm2',
    name: 'Growth & Events Marketing',
    description: 'Event operations, webcast calendars, talent acquisition summits, and demand generation.',
    memberIds: ['u2', 'u3', 'u4'],
    iconColor: 'bg-mp-green-500'
  }
];

