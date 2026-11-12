// Dependent mappings for HR Management

export const LOCATION_OPTIONS = [
  'On-Site',
  'Hybrid',
  'Remote',
  'Remote / Work From Home'
];

export const LOCATION_DIVISION_MAP: Record<string, string[]> = {
  'Main Headquarter (Cairo)': ['Corporate', 'Operations', 'Technology', 'Services', 'Finance & HR', 'Sales & Marketing'],
  'Cairo, Egypt': ['Corporate', 'Operations', 'Technology', 'Services', 'Finance & HR', 'Sales & Marketing'],
  'Alexandria Branch': ['Operations', 'Services', 'Customer Success', 'Sales & Marketing'],
  'Giza Branch': ['Operations', 'Sales & Marketing', 'Services'],
  'Dubai Branch': ['Middle East', 'Corporate', 'Sales & Marketing', 'Finance & HR', 'Operations'],
  'Riyadh Branch': ['Middle East', 'Operations', 'Sales & Marketing', 'Corporate'],
  'Riyadh, KSA': ['Middle East', 'Operations', 'Sales & Marketing', 'Corporate'],
  'London, UK': ['Europe', 'Corporate', 'Technology', 'Services'],
  'Paris, France': ['Europe', 'Corporate', 'Services'],
  'New York, USA': ['North America', 'Corporate', 'Finance & HR', 'Technology'],
  'Remote / Work From Home': ['Global', 'Technology', 'Product', 'Customer Success', 'Services'],
  'Remote': ['Global', 'Technology', 'Product', 'Customer Success', 'Services']
};

export const ALL_DIVISIONS = [
  'Corporate',
  'Operations',
  'Technology',
  'Services',
  'Finance & HR',
  'Sales & Marketing',
  'Customer Success',
  'Product',
  'Middle East',
  'Europe',
  'North America',
  'Global'
];

export function getDivisionsForLocation(location?: string): string[] {
  if (!location) return ALL_DIVISIONS;
  const locLow = (location || '').toLowerCase();
  const matchKey = Object.keys(LOCATION_DIVISION_MAP).find(
    k => {
      const kLow = (k || '').toLowerCase();
      return kLow === locLow || locLow.includes(kLow) || kLow.includes(locLow);
    }
  );
  return matchKey ? LOCATION_DIVISION_MAP[matchKey] : ALL_DIVISIONS;
}

export const CITIES_LIST = [
  'Cairo',
  'Alexandria',
  'Giza',
  'Mansoura',
  'Tanta',
  'Luxor',
  'Aswan',
  'Port Said',
  'Suez',
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Riyadh',
  'Jeddah',
  'Dammam',
  'London',
  'New York',
  'Paris'
];

export const CITY_COUNTY_MAP: Record<string, { county: string; country: string }> = {
  'Cairo': { county: 'Cairo Governorate (محافظة القاهرة)', country: 'Egypt' },
  'Alexandria': { county: 'Alexandria Governorate (محافظة الإسكندرية)', country: 'Egypt' },
  'Giza': { county: 'Giza Governorate (محافظة الجيزة)', country: 'Egypt' },
  'Mansoura': { county: 'Dakahlia Governorate (محافظة الدقهلية)', country: 'Egypt' },
  'Tanta': { county: 'Gharbia Governorate (محافظة الغربية)', country: 'Egypt' },
  'Luxor': { county: 'Luxor Governorate (محافظة الأقصر)', country: 'Egypt' },
  'Aswan': { county: 'Aswan Governorate (محافظة أسوان)', country: 'Egypt' },
  'Port Said': { county: 'Port Said Governorate (محافظة بورسعيد)', country: 'Egypt' },
  'Suez': { county: 'Suez Governorate (محافظة السويس)', country: 'Egypt' },
  'Dubai': { county: 'Emirate of Dubai (إمارة دبي)', country: 'United Arab Emirates' },
  'Abu Dhabi': { county: 'Emirate of Abu Dhabi (إمارة أبوظبي)', country: 'United Arab Emirates' },
  'Sharjah': { county: 'Emirate of Sharjah (إمارة الشارقة)', country: 'United Arab Emirates' },
  'Riyadh': { county: 'Riyadh Province (منطقة الرياض)', country: 'Saudi Arabia' },
  'Jeddah': { county: 'Makkah Province (منطقة مكة المكرمة)', country: 'Saudi Arabia' },
  'Dammam': { county: 'Eastern Province (المنطقة الشرقية)', country: 'Saudi Arabia' },
  'London': { county: 'Greater London', country: 'United Kingdom' },
  'New York': { county: 'New York County / NY', country: 'United States' },
  'Paris': { county: 'Île-de-France', country: 'France' }
};

export function getCountyAndCountryForCity(city?: string): { county: string; country: string } | null {
  if (!city) return null;
  const cityLow = (city || '').toLowerCase();
  const matchKey = Object.keys(CITY_COUNTY_MAP).find(
    k => {
      const kLow = (k || '').toLowerCase();
      return kLow === cityLow || cityLow.includes(kLow);
    }
  );
  return matchKey ? CITY_COUNTY_MAP[matchKey] : null;
}

export const DEPT_TEAMS_TITLES_MAP: Record<string, {
  teams: { name: string; jobTitles: string[] }[];
}> = {
  'Human Resources': {
    teams: [
      { name: 'Talent Acquisition', jobTitles: ['Recruiter', 'Talent Acquisition Specialist', 'Sourcing Lead', 'Head of Recruitment'] },
      { name: 'Employee Relations', jobTitles: ['Employee Relations Specialist', 'HR Business Partner', 'HR Advisor', 'Labor Specialist'] },
      { name: 'Payroll & Benefits', jobTitles: ['Payroll Specialist', 'Compensation & Benefits Analyst', 'Payroll Manager', 'Benefits Coordinator'] },
      { name: 'HR Operations', jobTitles: ['HR Administrator', 'HR Operations Specialist', 'Sr. HR Administrator', 'HR Generalist'] }
    ]
  },
  'Technology': {
    teams: [
      { name: 'Frontend', jobTitles: ['Frontend Engineer', 'Senior React Developer', 'UI Engineer', 'Lead Frontend Architect'] },
      { name: 'Backend', jobTitles: ['Backend Engineer', 'Node.js Developer', 'API Specialist', 'Database Architect'] },
      { name: 'DevOps & Cloud', jobTitles: ['DevOps Engineer', 'Cloud Architect', 'Site Reliability Engineer (SRE)', 'Security Engineer'] },
      { name: 'QA & Testing', jobTitles: ['QA Automation Engineer', 'Software Tester', 'QA Lead', 'Quality Assurance Specialist'] },
      { name: 'Mobile Development', jobTitles: ['iOS Developer', 'Android Developer', 'Mobile Lead', 'Flutter Engineer'] }
    ]
  },
  'Engineering': {
    teams: [
      { name: 'Software Engineering', jobTitles: ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Principal Engineer'] },
      { name: 'Infrastructure', jobTitles: ['DevOps Engineer', 'Systems Engineer', 'Cloud Engineer', 'Network Administrator'] },
      { name: 'QA & Testing', jobTitles: ['QA Engineer', 'Senior QA Engineer', 'Test Automation Engineer'] }
    ]
  },
  'Sales & Marketing': {
    teams: [
      { name: 'Direct Sales', jobTitles: ['Account Executive', 'Sales Representative', 'Sales Manager', 'Business Development Manager'] },
      { name: 'Digital Marketing', jobTitles: ['Digital Marketer', 'SEO Specialist', 'PPC Campaign Manager', 'Marketing Specialist'] },
      { name: 'Growth & Lead Gen', jobTitles: ['Growth Manager', 'Lead Generation Specialist', 'Conversion Specialist'] },
      { name: 'Content & Brand', jobTitles: ['Content Writer', 'Brand Specialist', 'Graphic Designer', 'Social Media Manager'] }
    ]
  },
  'Sales': {
    teams: [
      { name: 'Direct Sales', jobTitles: ['Sales Representative', 'Account Executive', 'Sales Manager', 'Regional Sales Director'] },
      { name: 'Enterprise Sales', jobTitles: ['Enterprise Account Executive', 'Key Account Manager', 'Sales Director'] },
      { name: 'Inside Sales', jobTitles: ['Sales Development Rep (SDR)', 'Inside Sales Specialist', 'Lead Qualifier'] }
    ]
  },
  'Finance': {
    teams: [
      { name: 'Accounting', jobTitles: ['Staff Accountant', 'Senior Accountant', 'Accounts Payable Clerk', 'Chief Accountant'] },
      { name: 'Financial Planning & Analysis', jobTitles: ['Financial Analyst', 'FP&A Manager', 'Budgeting Specialist'] },
      { name: 'Treasury & Audit', jobTitles: ['Treasury Analyst', 'Internal Auditor', 'Compliance Officer'] }
    ]
  },
  'Finance & HR': {
    teams: [
      { name: 'Accounting', jobTitles: ['Accountant', 'Senior Accountant', 'Finance Manager'] },
      { name: 'Financial Planning', jobTitles: ['Financial Analyst', 'FP&A Manager'] },
      { name: 'HR Services', jobTitles: ['HR Generalist', 'HR Officer', 'Payroll Specialist'] }
    ]
  },
  'Operations': {
    teams: [
      { name: 'Logistics & Supply Chain', jobTitles: ['Logistics Coordinator', 'Supply Chain Analyst', 'Warehouse Manager', 'Procurement Specialist'] },
      { name: 'Customer Operations', jobTitles: ['Operations Lead', 'Operations Specialist', 'Operations Director'] },
      { name: 'Process Improvement', jobTitles: ['Process Engineer', 'Kaizen Specialist', 'Quality Manager'] }
    ]
  },
  'Product': {
    teams: [
      { name: 'Product Management', jobTitles: ['Product Manager', 'Senior Product Manager', 'Product Owner', 'VP of Product'] },
      { name: 'Product Design (UI/UX)', jobTitles: ['UI/UX Designer', 'Product Designer', 'Design Systems Lead', 'User Researcher'] }
    ]
  },
  'Customer Success': {
    teams: [
      { name: 'Customer Support', jobTitles: ['Customer Support Specialist', 'Support Lead', 'Technical Support Engineer'] },
      { name: 'Client Onboarding', jobTitles: ['Onboarding Specialist', 'Implementation Manager', 'Client Success Partner'] },
      { name: 'Account Management', jobTitles: ['Customer Success Manager', 'Account Manager', 'Retention Specialist'] }
    ]
  }
};

export function getTeamsAndTitlesForDepartment(deptName?: string, deptObj?: any): {
  teams: { name: string; jobTitles: string[] }[];
  allJobTitles: string[];
} {
  let teamsList: { name: string; jobTitles: string[] }[] = [];

  // Check if deptObj has teams
  if (deptObj?.teams) {
    let parsedTeams: any[] = [];
    if (Array.isArray(deptObj.teams)) parsedTeams = deptObj.teams;
    else if (typeof deptObj.teams === 'string') {
      try { parsedTeams = JSON.parse(deptObj.teams); } catch (e) {}
    }
    if (parsedTeams.length > 0) {
      teamsList = parsedTeams.map((t: any) => {
        const tName = typeof t === 'string' ? t : (t?.name || '');
        const rawTeamTitles = Array.isArray(t?.job_titles) ? t.job_titles : (Array.isArray(t?.jobTitles) ? t.jobTitles : []);
        const parsedTeamTitles = rawTeamTitles.map((x: any) => typeof x === 'string' ? x : (x?.title || x?.name || '')).filter(Boolean);
        return {
          name: tName,
          jobTitles: parsedTeamTitles
        };
      }).filter(t => Boolean(t.name));
    }
  }

  // Check direct department job_titles
  let directDeptTitles: string[] = [];
  if (deptObj) {
    const rawJT = deptObj.job_titles || deptObj.jobTitles;
    if (Array.isArray(rawJT)) {
      directDeptTitles = rawJT.map((x: any) => typeof x === 'string' ? x : (x?.title || x?.name || '')).filter(Boolean);
    } else if (typeof rawJT === 'string') {
      try {
        const parsed = JSON.parse(rawJT);
        if (Array.isArray(parsed)) {
          directDeptTitles = parsed.map((x: any) => typeof x === 'string' ? x : (x?.title || x?.name || '')).filter(Boolean);
        } else if (typeof parsed === 'string' && parsed.trim()) {
          directDeptTitles = parsed.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        if (rawJT.trim()) {
          directDeptTitles = rawJT.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
  }

  // Fallback to DEPT_TEAMS_TITLES_MAP if empty teamsList AND empty directDeptTitles
  if (teamsList.length === 0 && directDeptTitles.length === 0 && deptName && DEPT_TEAMS_TITLES_MAP[deptName]) {
    teamsList = DEPT_TEAMS_TITLES_MAP[deptName].teams;
  }

  let allJobTitles = Array.from(new Set([
    ...directDeptTitles,
    ...teamsList.flatMap(t => t.jobTitles)
  ])).filter(Boolean);

  // If still empty teamsList
  if (teamsList.length === 0) {
    const fallbackTitles = allJobTitles.length > 0 
      ? allJobTitles 
      : ['Team Member', 'Specialist', 'Lead', 'Manager'];
    
    teamsList = [
      { name: 'General', jobTitles: fallbackTitles }
    ];
    allJobTitles = fallbackTitles;
  } else if (directDeptTitles.length > 0) {
    // If teams exist, ensure each team has job titles or inherits direct dept titles if its own jobTitles are empty
    teamsList = teamsList.map(t => ({
      ...t,
      jobTitles: t.jobTitles.length > 0 ? t.jobTitles : directDeptTitles
    }));
  }

  return { teams: teamsList, allJobTitles };
}

export const GRADE_LEVEL_OPTIONS = [
  'Grade 1 / Executive / C-Level',
  'Grade 2 / Director / Department Head',
  'Grade 3 / Manager / Team Lead',
  'Grade 4 / Senior Specialist / Lead',
  'Grade 5 / Mid-Senior / Specialist',
  'Grade 6 / Associate / Junior',
  'Grade 7 / Entry Level'
];

export function getGradeForJobTitle(
  title?: string,
  deptNameOrId?: string | number,
  departments?: any[],
  configuredGrades?: any[]
): string {
  if (!title || typeof title !== 'string') return '';
  const normalized = title.trim().toLowerCase();

  // 1. Check departments (from database/props) for explicit Level / Grade defined in Job Titles Directory
  if (Array.isArray(departments) && departments.length > 0) {
    const targetDept = deptNameOrId 
      ? departments.find(d => 
          (typeof deptNameOrId === 'number' && d.id === deptNameOrId) ||
          (typeof deptNameOrId === 'string' && (
            (d.name && d.name.toLowerCase().trim() === String(deptNameOrId).toLowerCase().trim()) || 
            String(d.id) === String(deptNameOrId)
          ))
        )
      : null;

    const deptsToCheck = targetDept 
      ? [targetDept, ...departments.filter(d => d.id !== targetDept.id)]
      : departments;

    for (const dept of deptsToCheck) {
      // Check dept.job_titles (parsed array)
      let deptTitles: any[] = [];
      if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
      else if (typeof dept.job_titles === 'string') {
        try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
      }

      for (const jt of deptTitles) {
        if (typeof jt === 'object' && jt) {
          const tStr = jt.title || jt.name;
          if (tStr && String(tStr).trim().toLowerCase() === normalized) {
            const lvl = jt.level || jt.grade;
            if (lvl) {
              const res = typeof lvl === 'string' ? lvl : (lvl.title || lvl.name || String(lvl));
              if (res && res.trim()) return res.trim();
            }
          }
        }
      }

      // Check dept.teams
      let deptTeams: any[] = [];
      if (Array.isArray(dept.teams)) deptTeams = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
      }

      for (const tm of deptTeams) {
        const rawTTitles = Array.isArray(tm?.job_titles) ? tm.job_titles : (Array.isArray(tm?.jobTitles) ? tm.jobTitles : []);
        for (const tItem of rawTTitles) {
          if (typeof tItem === 'object' && tItem) {
            const tStr = tItem.title || tItem.name;
            if (tStr && String(tStr).trim().toLowerCase() === normalized) {
              const lvl = tItem.level || tItem.grade;
              if (lvl) {
                const res = typeof lvl === 'string' ? lvl : (lvl.title || lvl.name || String(lvl));
                if (res && res.trim()) return res.trim();
              }
            }
          }
        }
      }
    }
  }

  // 2. Try LocalStorage custom JDs
  try {
    const raw = localStorage.getItem('systo_custom_jds');
    if (raw) {
      const parsed = JSON.parse(raw);
      const matchedKey = Object.keys(parsed).find(k => k.trim().toLowerCase() === normalized);
      if (matchedKey && parsed[matchedKey]) {
        const item = parsed[matchedKey];
        const g = item.grade || item.level;
        if (g && typeof g === 'string' && g.trim()) return g.trim();
      }
    }
  } catch (e) {}

  // 3. Match from configured grades list if supplied
  if (Array.isArray(configuredGrades) && configuredGrades.length > 0) {
    if (/chief|c-level|executive|ceo|cto|cfo|coo|president|managing director/i.test(normalized)) {
      const g = configuredGrades.find(x => x.code === 'L1' || x.rank_weight === 1 || /c-level|executive/i.test(x.name));
      if (g) return `${g.code} - ${g.name}`;
    }
    if (/director|head|vp|vice president/i.test(normalized)) {
      const g = configuredGrades.find(x => x.code === 'L2' || x.rank_weight === 2 || /director|head/i.test(x.name));
      if (g) return `${g.code} - ${g.name}`;
    }
    if (/manager|lead manager|supervisor|team lead/i.test(normalized)) {
      const g = configuredGrades.find(x => x.code === 'L3' || x.rank_weight === 3 || /manager|lead/i.test(x.name));
      if (g) return `${g.code} - ${g.name}`;
    }
    if (/senior|principal|architect|expert|specialist/i.test(normalized)) {
      const g = configuredGrades.find(x => x.code === 'L4' || x.rank_weight === 4 || /senior|specialist/i.test(x.name)) ||
                configuredGrades.find(x => x.code === 'L3');
      if (g) return `${g.code} - ${g.name}`;
    }
    if (/junior|associate|assistant|entry|runner|clerk|trainee|intern/i.test(normalized)) {
      const g = configuredGrades.find(x => x.code === 'L6' || x.code === 'L7' || x.code === 'L5' || /junior|associate|entry/i.test(x.name));
      if (g) return `${g.code} - ${g.name}`;
    }
  }

  // 4. Default fallback based on job title keywords
  if (/chief|c-level|executive|ceo|cto|cfo|coo|vp|president/i.test(normalized)) {
    return 'Grade 1 / Executive / C-Level';
  } else if (/director|head/i.test(normalized)) {
    return 'Grade 2 / Director / Department Head';
  } else if (/manager|lead manager/i.test(normalized)) {
    return 'Grade 3 / Manager / Team Lead';
  } else if (/senior|lead|principal|architect/i.test(normalized)) {
    return 'Grade 4 / Senior Specialist / Lead';
  } else if (/associate|junior|intern|assistant|runner|clerk/i.test(normalized)) {
    return 'Grade 6 / Associate / Junior';
  } else if (/entry/i.test(normalized)) {
    return 'Grade 7 / Entry Level';
  }

  return 'Grade 5 / Mid-Senior / Specialist';
}

export function getJDForTitle(
  title?: string,
  deptNameOrId?: string | number,
  departments?: any[],
  configuredGrades?: any[]
): {
  department?: string;
  team?: string;
  grade?: string;
  reportsTo?: string;
  location?: string;
} | null {
  if (!title || typeof title !== 'string') return null;
  const normalized = title.trim().toLowerCase();

  // 1. Direct grade check from Job Titles Directory
  const resolvedGrade = getGradeForJobTitle(title, deptNameOrId, departments, configuredGrades);

  // 2. Try LocalStorage custom JDs
  try {
    const raw = localStorage.getItem('systo_custom_jds');
    if (raw) {
      const parsed = JSON.parse(raw);
      const matchedKey = Object.keys(parsed).find(k => k.trim().toLowerCase() === normalized);
      if (matchedKey && parsed[matchedKey]) {
        const item = parsed[matchedKey];
        return {
          department: item.department,
          team: item.team,
          grade: item.grade || item.level || resolvedGrade,
          reportsTo: item.reportsTo || item.reportingTo || item.manager,
          location: item.location
        };
      }
    }
  } catch (e) {}

  let location = 'On-Site';
  if (/remote|work from home|wfh/i.test(normalized)) {
    location = 'Remote / Work From Home';
  } else if (/hybrid/i.test(normalized)) {
    location = 'Hybrid';
  }

  return {
    grade: resolvedGrade,
    location
  };
}

