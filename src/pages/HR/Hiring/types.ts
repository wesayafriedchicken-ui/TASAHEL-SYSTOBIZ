export interface JobOpening {
  id: number;
  title: string;
  department_id: number | null;
  department_name?: string;
  department?: string;
  created_by?: number;
  headcount_needed: number;
  status: 'Pending HR Approval' | 'Active' | 'Paused' | 'Closed' | 'Rejected' | string;
  salary_range: string;
  experience_requirements: string;
  budget_status?: string;
  description_blocks?: string;
  candidate_count?: number;
  location?: string;
  employment_type?: string;
  hiring_lead?: string;
  days_open?: number;
}

export interface Candidate {
  id: number;
  job_opening_id: number;
  job_title?: string;
  applied_role?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  cv_url?: string;
  cv_link?: string;
  portfolio_url?: string;
  stage: 'Applied' | 'Screened' | 'Interviewing' | 'Technical Assessment' | 'Job Offer Sent' | 'Hired' | 'Rejected' | string;
  score: number;
  notes: string;
  created_at?: string;
  created_by?: number;
  recruiter?: string;
  assigned_recruiter?: string;
  interviewer?: string;
}

export interface Interview {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  job_title?: string;
  title: string;
  interview_date: string;
  interviewer_id: number | null;
  interviewer_name?: string;
  meeting_link: string;
  notes: string;
  technical_score?: number | null;
  technical_notes?: string | null;
}

export interface EditorBlock {
  id: string;
  type: 'header' | 'text' | 'bullets' | 'callout';
  content: string;
}

export const DEFAULT_DEPARTMENT_JOB_TITLES: Record<string, string[]> = {
  'Engineering': ['Software Engineer', 'Senior Backend Engineer', 'Frontend Developer', 'Full Stack Engineer', 'DevOps Engineer', 'Mobile App Developer', 'QA & Automation Engineer', 'Systems Architect', 'UI/UX Designer', 'Engineering Manager'],
  'Human Resources': ['HR Specialist', 'Talent Acquisition Recruiter', 'HR Manager', 'Personnel Specialist', 'Payroll Administrator', 'Training & Development Officer', 'HR Business Partner'],
  'Finance': ['Senior Accountant', 'Financial Analyst', 'Budget Specialist', 'Treasury Manager', 'Internal Auditor', 'Payroll Specialist', 'Chief Financial Officer (CFO)'],
  'Marketing': ['Marketing Specialist', 'Digital Content Creator', 'SEO & SEM Specialist', 'Growth Marketing Manager', 'Brand Manager', 'Graphic Designer', 'Social Media Coordinator'],
  'Sales': ['Sales Executive', 'Account Manager', 'Business Development Specialist', 'Sales Manager', 'CRM Specialist', 'Enterprise Sales Lead'],
  'Operations': ['Operations Coordinator', 'Procurement Manager', 'Supply Chain Analyst', 'Quality Inspector', 'Logistics Specialist', 'Facility Manager'],
  'Customer Support': ['Customer Support Representative', 'Technical Support Specialist', 'Client Success Manager', 'Call Center Team Lead']
};

export const getJobTitlesForDepartment = (deptId: number | null, deptsList: any[], empList: any[], jobsList: any[]) => {
  const titlesSet = new Set<string>();
  if (deptId) {
    const dept = deptsList.find(d => d.id === deptId);
    const deptName = dept ? dept.name : null;

    if (deptName && DEFAULT_DEPARTMENT_JOB_TITLES[deptName]) {
      DEFAULT_DEPARTMENT_JOB_TITLES[deptName].forEach(t => titlesSet.add(t));
    }

    empList
      .filter(e => e.department_id === deptId && e.job_title)
      .forEach(e => titlesSet.add(e.job_title.trim()));

    jobsList
      .filter(j => j.department_id === deptId && j.title)
      .forEach(j => titlesSet.add(j.title.trim()));
  }

  if (titlesSet.size === 0) {
    empList.filter(e => e.job_title).forEach(e => titlesSet.add(e.job_title.trim()));
    jobsList.filter(j => j.title).forEach(j => titlesSet.add(j.title.trim()));
  }

  return Array.from(titlesSet);
};

export const getJobSlug = (job: { id: number | string; title?: string }) => {
  if (!job) return '';
  const cleanTitle = (job.title || 'opening')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  return `${job.id}-${cleanTitle}`;
};

export const parseJobIdFromSlug = (slugOrId: string | undefined): number | null => {
  if (!slugOrId) return null;
  const match = String(slugOrId).match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
};
