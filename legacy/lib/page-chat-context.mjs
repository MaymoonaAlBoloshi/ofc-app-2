export const pageChatProfiles = {
  corporate: {
    name: 'Corporate',
    goal: 'Review group performance, priorities and management decisions.',
    prompts: [
      'Summarize this page for management',
      'What needs attention here?',
      'Suggest questions for the next review',
    ],
  },
  finance: {
    name: 'Finance & Accounts',
    goal: 'Understand financial performance, reconcile variances and keep reporting and close activities on track.',
    prompts: [
      'Explain the figures on this page',
      'What should I investigate first?',
      'Draft a finance review checklist',
    ],
  },
  treasury: {
    name: 'Treasury',
    goal: 'Review liquidity, funding needs, cash movements and treasury exposure.',
    prompts: [
      'Summarize the liquidity position shown',
      'Which funding risks should I review?',
      'Draft a cash review checklist',
    ],
  },
  strategy: {
    name: 'Strategy',
    goal: 'Review strategic objectives, performance indicators and progress against plans.',
    prompts: [
      'Summarize progress on this page',
      'Which objectives need attention?',
      'Suggest next steps for this review',
    ],
  },
  investment: {
    name: 'Investment & Deal Sourcing',
    goal: 'Assess investment opportunities, due diligence and progress through the deal pipeline.',
    prompts: [
      'Summarize the opportunities shown',
      'What due diligence questions should I ask?',
      'Suggest next steps for these deals',
    ],
  },
  pmo: {
    name: 'PMO',
    goal: 'Review project delivery, milestones, dependencies and execution risks.',
    prompts: [
      'Summarize delivery progress here',
      'What could block the next milestone?',
      'Draft a project status update',
    ],
  },
  'asset-management': {
    name: 'Asset Management',
    goal: 'Review subsidiary performance, portfolio priorities and follow-up actions.',
    prompts: [
      'Summarize this subsidiary view',
      'Which actions need attention?',
      'Compare ONLDC revenue with its February 2026 budget',
    ],
  },
};
export function normalizePageContext(input) {
  if (!input || typeof input !== 'object' || !Object.hasOwn(pageChatProfiles, input.department))
    return null;
  const clean = (value, max) =>
    typeof value === 'string'
      ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max)
      : '';
  const profile = pageChatProfiles[input.department];
  return {
    department: input.department,
    departmentName: profile.name,
    goal: profile.goal,
    title: clean(input.title, 200),
    description: clean(input.description, 600),
    visibleText: clean(input.visibleText, 10000),
    filters: clean(input.filters, 1000),
    dataStatus:
      'Visible workspace content is demo/sample data, not verified client evidence. Client evidence is separately cited and dated.',
  };
}
export function promptsForPage(department, title) {
  if (/tracker|closing|submission|actions|register/i.test(title))
    return [
      'Summarize the recorded status here',
      'Which items need follow-up?',
      'Draft a follow-up checklist',
    ];
  if (/report|briefing/i.test(title))
    return [
      'Summarize this report',
      'Which claims need checking?',
      'Draft talking points for this report',
    ];
  return (pageChatProfiles[department] || pageChatProfiles.corporate).prompts;
}
