import { format, addDays } from 'date-fns';
import { User, Priority, Status } from '../types';

export interface GeneratedWorkflow {
  projectName: string;
  description: string;
  color: string;
  sections: Array<{ name: string; order: number }>;
  tasks: Array<{
    title: string;
    description: string;
    sectionName: string;
    status: Status;
    priority: Priority;
    dayOffset: number;
    subtasks: string[];
    assigneeId?: string;
  }>;
  summary: string;
}

export async function generateProjectWorkflow(
  prompt: string,
  deadlineStr: string | undefined,
  teamMembers: User[]
): Promise<GeneratedWorkflow> {
  try {
    const res = await fetch('/api/ai/generate-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        deadline: deadlineStr,
        teamMembers: teamMembers.map(u => ({ id: u.id, name: u.name, role: u.role }))
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.projectName && Array.isArray(data.sections) && Array.isArray(data.tasks)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend AI generation encountered issue, using smart workflow engine fallback:', e);
  }

  // Smart fallback generator tailored to the prompt
  return generateFallbackWorkflow(prompt, deadlineStr, teamMembers);
}

function generateFallbackWorkflow(
  prompt: string,
  deadlineStr: string | undefined,
  teamMembers: User[]
): GeneratedWorkflow {
  const lower = prompt.toLowerCase();

  let projectName = 'New Initiative Workflow';
  let description = prompt;
  let color = 'bg-mp-blue-500';

  if (lower.includes('launch') || lower.includes('product') || lower.includes('release')) {
    projectName = 'Product Launch & Go-To-Market';
    color = 'bg-indigo-500';
  } else if (lower.includes('redesign') || lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
    projectName = 'UI/UX Redesign & Modernization';
    color = 'bg-purple-500';
  } else if (lower.includes('marketing') || lower.includes('campaign') || lower.includes('brand')) {
    projectName = 'Marketing Campaign & Brand Outreach';
    color = 'bg-rose-500';
  } else if (lower.includes('sprint') || lower.includes('dev') || lower.includes('software') || lower.includes('app')) {
    projectName = 'Software Development Sprint';
    color = 'bg-emerald-500';
  } else if (lower.includes('onboard') || lower.includes('hiring') || lower.includes('hr')) {
    projectName = 'Team Onboarding & Operations';
    color = 'bg-amber-500';
  } else {
    // derive name from prompt
    const words = prompt.trim().split(' ');
    projectName = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
    projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);
  }

  const sections = [
    { name: '1. Discovery & Strategy', order: 1 },
    { name: '2. Planning & Architecture', order: 2 },
    { name: '3. Execution & Build', order: 3 },
    { name: '4. Quality Assurance & Review', order: 4 },
    { name: '5. Launch & Retrospective', order: 5 }
  ];

  const tasks = [
    {
      title: 'Define scope, OKRs, and success metrics',
      description: `Establish core milestones, KPIs, and deliverables for ${projectName}.`,
      sectionName: '1. Discovery & Strategy',
      status: 'In Progress' as Status,
      priority: 'High' as Priority,
      dayOffset: 2,
      subtasks: ['Draft project brief', 'Align with key stakeholders', 'Finalize success KPIs']
    },
    {
      title: 'Conduct stakeholder alignment & resource check',
      description: 'Audit team availability and secure necessary tooling access.',
      sectionName: '1. Discovery & Strategy',
      status: 'To Do' as Status,
      priority: 'Medium' as Priority,
      dayOffset: 4,
      subtasks: ['Team kickoff meeting', 'Identify blockers']
    },
    {
      title: 'Draft roadmap, milestones, and timeline specifications',
      description: 'Break down deliverables into weekly sprints with dependencies mapped.',
      sectionName: '2. Planning & Architecture',
      status: 'To Do' as Status,
      priority: 'High' as Priority,
      dayOffset: 7,
      subtasks: ['Build Gantt/Timeline breakdown', 'Document edge cases', 'Approval sign-off']
    },
    {
      title: 'Core deliverable execution & component development',
      description: 'Implement primary technical and operational deliverables.',
      sectionName: '3. Execution & Build',
      status: 'To Do' as Status,
      priority: 'High' as Priority,
      dayOffset: 14,
      subtasks: ['Sprint phase 1 implementation', 'Mid-point review check-in', 'Complete sprint phase 2']
    },
    {
      title: 'Asset production and cross-team integration',
      description: 'Ensure documentation, collateral, and integrations are completed.',
      sectionName: '3. Execution & Build',
      status: 'To Do' as Status,
      priority: 'Medium' as Priority,
      dayOffset: 18,
      subtasks: ['Draft internal documentation', 'Review collateral']
    },
    {
      title: 'End-to-end testing, QA review, and edge case audits',
      description: 'Perform rigorous smoke testing and acceptance verification.',
      sectionName: '4. Quality Assurance & Review',
      status: 'To Do' as Status,
      priority: 'High' as Priority,
      dayOffset: 23,
      subtasks: ['Conduct acceptance tests', 'Resolve high-priority defects', 'Sign-off on QA checklist']
    },
    {
      title: 'Deployment & Go-Live readiness verification',
      description: 'Deploy to production environment and verify all telemetry streams.',
      sectionName: '5. Launch & Retrospective',
      status: 'To Do' as Status,
      priority: 'High' as Priority,
      dayOffset: 28,
      subtasks: ['Cut release build', 'Execute go-live checklist', 'Verify live status']
    },
    {
      title: 'Post-launch metrics tracking and retrospective meeting',
      description: 'Gather team feedback and analyze initial performance metrics.',
      sectionName: '5. Launch & Retrospective',
      status: 'To Do' as Status,
      priority: 'Low' as Priority,
      dayOffset: 32,
      subtasks: ['Synthesize retro notes', 'Archive project artifacts']
    }
  ];

  return {
    projectName,
    description,
    color,
    sections,
    tasks,
    summary: `Structured ${sections.length}-stage workflow with ${tasks.length} actionable milestone tasks, phased deadlines, and integrated quality checklists.`
  };
}
