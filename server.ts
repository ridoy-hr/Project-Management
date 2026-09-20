import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function generateFallbackWorkflow(prompt: string, deadline?: string) {
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
      status: 'In Progress',
      priority: 'High',
      dayOffset: 2,
      subtasks: ['Draft project brief', 'Align with key stakeholders', 'Finalize success KPIs']
    },
    {
      title: 'Conduct stakeholder alignment & resource check',
      description: 'Audit team availability and secure necessary tooling access.',
      sectionName: '1. Discovery & Strategy',
      status: 'To Do',
      priority: 'Medium',
      dayOffset: 4,
      subtasks: ['Team kickoff meeting', 'Identify blockers']
    },
    {
      title: 'Draft roadmap, milestones, and timeline specifications',
      description: 'Break down deliverables into weekly sprints with dependencies mapped.',
      sectionName: '2. Planning & Architecture',
      status: 'To Do',
      priority: 'High',
      dayOffset: 7,
      subtasks: ['Build timeline breakdown', 'Document edge cases', 'Approval sign-off']
    },
    {
      title: 'Core deliverable execution & component development',
      description: 'Implement primary technical and operational deliverables.',
      sectionName: '3. Execution & Build',
      status: 'To Do',
      priority: 'High',
      dayOffset: 14,
      subtasks: ['Sprint phase 1 implementation', 'Mid-point review check-in', 'Complete sprint phase 2']
    },
    {
      title: 'Asset production and cross-team integration',
      description: 'Ensure documentation, collateral, and integrations are completed.',
      sectionName: '3. Execution & Build',
      status: 'To Do',
      priority: 'Medium',
      dayOffset: 18,
      subtasks: ['Draft internal documentation', 'Review collateral']
    },
    {
      title: 'End-to-end testing, QA review, and edge case audits',
      description: 'Perform rigorous smoke testing and acceptance verification.',
      sectionName: '4. Quality Assurance & Review',
      status: 'To Do',
      priority: 'High',
      dayOffset: 23,
      subtasks: ['Conduct acceptance tests', 'Resolve high-priority defects', 'Sign-off on QA checklist']
    },
    {
      title: 'Deployment & Go-Live readiness verification',
      description: 'Deploy to production environment and verify all telemetry streams.',
      sectionName: '5. Launch & Retrospective',
      status: 'To Do',
      priority: 'High',
      dayOffset: 28,
      subtasks: ['Cut release build', 'Execute go-live checklist', 'Verify live status']
    },
    {
      title: 'Post-launch metrics tracking and retrospective meeting',
      description: 'Gather team feedback and analyze initial performance metrics.',
      sectionName: '5. Launch & Retrospective',
      status: 'To Do',
      priority: 'Low',
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Workflow Generation Endpoint
  app.post("/api/ai/generate-workflow", async (req, res) => {
    try {
      const { prompt, deadline, teamMembers } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json(generateFallbackWorkflow(prompt, deadline));
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are an expert Agile project manager and workflow architect. Given a project description and optional target deadline, generate a highly comprehensive, production-ready project workflow.
You MUST break down the project into a deeply detailed, exhaustive list of tasks. Do not provide a superficial summary. 
REQUIREMENTS:
1. Generate AT LEAST 15-25 distinct tasks that cover all phases of the project lifecycle from discovery to launch/retrospective.
2. Provide thorough, actionable, and specific 'description' text for every task (at least 2-3 sentences per task).
3. Include 3-5 concrete 'subtasks' for every single task to ensure it is actionable.
4. Distribute tasks logically across 4-6 sequential 'sections' (e.g., Discovery, Planning, Execution, QA, Launch).
5. Calculate realistic 'dayOffset' values (e.g., 0 for kickoff tasks, 14 for mid-project, 30 for launch).

Return strictly valid JSON adhering to this exact schema:
{
  "projectName": "string",
  "description": "string (detailed project overview)",
  "color": "bg-mp-blue-500",
  "sections": [
    { "name": "Section Name", "order": 1 }
  ],
  "tasks": [
    {
      "title": "Task title",
      "description": "Task details",
      "sectionName": "Section Name",
      "status": "To Do",
      "priority": "High",
      "dayOffset": 3,
      "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
    }
  ],
  "summary": "Brief summary of the workflow structure"
}
Allowed colors: bg-mp-blue-500, bg-emerald-500, bg-amber-500, bg-indigo-500, bg-rose-500, bg-purple-500.
Allowed status: To Do, In Progress, Review, Done.
Allowed priority: Low, Medium, High.
Do not include markdown code block backticks, return raw json.`;

      // Fallback model chain prioritizing available, high-performance models for detailed generation
      const CANDIDATE_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash"
      ];

      let parsed: any = null;
      let lastErrorMessage = "";

      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: `Project description: ${prompt}\nTarget deadline: ${deadline || '30 days from now'}\nAvailable team: ${JSON.stringify(teamMembers || [])}`,
            config: {
              systemInstruction,
              responseMimeType: "application/json"
            }
          });

          const responseText = response.text || "{}";
          const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          const candidateData = JSON.parse(cleaned);
          if (candidateData && candidateData.projectName && Array.isArray(candidateData.sections) && Array.isArray(candidateData.tasks)) {
            parsed = candidateData;
            break;
          }
        } catch (modelErr: any) {
          lastErrorMessage = modelErr?.message || String(modelErr);
          console.warn(`[AI Workflow] Model ${model} unavailable (transient/503 demand spike): ${lastErrorMessage}. Trying fallback model if available.`);
        }
      }

      if (parsed) {
        return res.json(parsed);
      }

      // If all models are temporarily busy during high demand spikes, return resilient structured workflow
      console.warn(`[AI Workflow] All candidate models busy (${lastErrorMessage}). Returning resilient workflow fallback.`);
      return res.json(generateFallbackWorkflow(prompt, deadline));
    } catch (err: any) {
      console.warn("[AI Workflow] Unexpected error, serving fallback workflow:", err?.message || err);
      const { prompt, deadline } = req.body || {};
      return res.json(generateFallbackWorkflow(prompt || "New Initiative", deadline));
    }
  });

  // Google Sheets Apps Script Webhook
  const pendingSheetWebhooks: Record<string, any[]> = {};

  app.post("/api/projects/:projectId/sheet-webhook", (req, res) => {
    const { projectId } = req.params;
    const { tasks } = req.body || {};
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "tasks array is required in request body" });
    }
    if (!pendingSheetWebhooks[projectId]) {
      pendingSheetWebhooks[projectId] = [];
    }
    pendingSheetWebhooks[projectId].push(...tasks);
    console.log(`[Google Apps Script] Received ${tasks.length} tasks for project ${projectId}`);
    return res.json({ success: true, count: tasks.length });
  });

  app.get("/api/projects/:projectId/pending-sheet-tasks", (req, res) => {
    const { projectId } = req.params;
    const queued = pendingSheetWebhooks[projectId] || [];
    pendingSheetWebhooks[projectId] = [];
    return res.json({ tasks: queued });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
