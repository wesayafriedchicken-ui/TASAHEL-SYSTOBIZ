import { Department, Employee, DepartmentTeam } from '../../../types';
import { JobDescriptionDetails } from '../../../components/HR/DepartmentSubTabs';

/**
 * Safely extracts a clean job title string from either a string or an object { title, level, team, name }
 */
export const extractJobTitleString = (jt: any): string => {
  if (!jt) return '';
  if (typeof jt === 'string') return jt.trim();
  if (typeof jt === 'object') {
    return (jt.title || jt.name || '').trim();
  }
  return String(jt).trim();
};

/**
 * Parses any job_titles field (JSON string, array of strings, array of objects) into a clean string array.
 */
export const parseJobTitles = (raw: any): string[] => {
  if (!raw) return [];
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
      else if (typeof parsed === 'string') list = parsed.split(',');
      else list = [parsed];
    } catch (e) {
      list = raw.split(',');
    }
  } else if (typeof raw === 'object') {
    list = [raw];
  }
  return list.map(extractJobTitleString).filter(Boolean);
};

/**
 * Parses any teams field (JSON string or array) into a clean DepartmentTeam array with normalized job_titles.
 */
export const parseTeams = (raw: any): DepartmentTeam[] => {
  if (!raw) return [];
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch (e) {}
  }
  return list.map((t: any, idx: number) => ({
    id: t?.id || (idx + 1),
    name: typeof t === 'string' ? t : (t?.name || `Team ${idx + 1}`),
    description: t?.description || '',
    team_lead_id: t?.team_lead_id ? parseInt(String(t.team_lead_id)) : null,
    job_titles: parseJobTitles(t?.job_titles || t?.jobTitles)
  }));
};

export const syncJDsForDeptObject = async (deptObj: any) => {
  try {
    const deptName = deptObj.name;
    if (!deptName) return;

    let rawTitles: any[] = [];
    if (Array.isArray(deptObj.job_titles)) rawTitles = deptObj.job_titles;
    else if (typeof deptObj.job_titles === 'string') {
      try { rawTitles = JSON.parse(deptObj.job_titles); } catch (e) {}
    }

    let rawTeams: any[] = [];
    if (Array.isArray(deptObj.teams)) rawTeams = deptObj.teams;
    else if (typeof deptObj.teams === 'string') {
      try { rawTeams = JSON.parse(deptObj.teams); } catch (e) {}
    }

    const titleToTeamMap = new Map<string, string>();

    rawTeams.forEach((t: any) => {
      const tName = typeof t === 'string' ? t : (t?.name || '');
      const tTitles = Array.isArray(t?.job_titles) ? t.job_titles : (Array.isArray(t?.jobTitles) ? t.jobTitles : []);
      tTitles.forEach((jt: any) => {
        const titleStr = typeof jt === 'string' ? jt : (jt?.title || jt?.name || '');
        if (titleStr) {
          titleToTeamMap.set(titleStr.trim(), tName);
        }
      });
    });

    rawTitles.forEach((jt: any) => {
      const titleStr = typeof jt === 'string' ? jt : (jt?.title || jt?.name || '');
      if (titleStr) {
        const trimmed = titleStr.trim();
        if (!titleToTeamMap.has(trimmed)) {
          titleToTeamMap.set(trimmed, '');
        }
      }
    });

    let dbJDs: any[] = [];
    try {
      const resGet = await fetch('/api/job_descriptions');
      if (resGet.ok) {
        dbJDs = await resGet.json();
      }
    } catch (e) {}

    let customJDsMap: Record<string, any> = {};
    try {
      const local = localStorage.getItem('systo_custom_jds');
      if (local) customJDsMap = JSON.parse(local);
    } catch (e) {}

    for (const [titleStr, teamName] of titleToTeamMap.entries()) {
      const existingDb = Array.isArray(dbJDs) ? dbJDs.find((item: any) => item.title?.toLowerCase() === (titleStr || '').toLowerCase()) : null;

      const jdDetails: JobDescriptionDetails = {
        department: deptName,
        team: teamName || '',
        grade: existingDb?.grade || 'Grade 3 / Mid-Senior',
        salaryBand: existingDb?.salary_band || '',
        reportsTo: existingDb?.reports_to || `${deptName} Manager`,
        employmentType: existingDb?.employment_type || 'Full-Time',
        location: existingDb?.location || 'On-Site',
        status: (existingDb?.status as any) || 'Approved',
        objective: existingDb?.objective || `Drive key operational deliverables as a ${titleStr} within ${deptName}.`,
        responsibilities: existingDb?.responsibilities
          ? (typeof existingDb.responsibilities === 'string' ? JSON.parse(existingDb.responsibilities) : existingDb.responsibilities)
          : [
              `Execute primary business deliverables aligned with the ${titleStr} functional scope.`,
              `Collaborate with team members and department leadership.`,
              `Maintain quality standards and operational compliance.`
            ],
        education: existingDb?.education || "Bachelor's Degree in relevant field or equivalent practical experience.",
        technicalSkills: existingDb?.technical_skills
          ? (typeof existingDb.technical_skills === 'string' ? JSON.parse(existingDb.technical_skills) : existingDb.technical_skills)
          : [`${deptName} Operations`, 'Process Workflow Optimization'],
        softSkills: existingDb?.soft_skills
          ? (typeof existingDb.soft_skills === 'string' ? JSON.parse(existingDb.soft_skills) : existingDb.soft_skills)
          : ['Cross-Functional Communication', 'Problem Solving', 'Accountability'],
        certifications: existingDb?.certifications
          ? (typeof existingDb.certifications === 'string' ? JSON.parse(existingDb.certifications) : existingDb.certifications)
          : ['Relevant Professional Certification'],
        kpis: existingDb?.kpis
          ? (typeof existingDb.kpis === 'string' ? JSON.parse(existingDb.kpis) : existingDb.kpis)
          : ['On-time deliverable completion ≥ 95%', 'Adherence to departmental SOPs'],
        raciRole: (existingDb?.raci_role as any) || 'Responsible'
      };

      customJDsMap[titleStr] = jdDetails;

      const payload = {
        title: titleStr,
        department: deptName,
        team: teamName || '',
        grade: jdDetails.grade,
        salary_band: jdDetails.salaryBand,
        reports_to: jdDetails.reportsTo,
        employment_type: jdDetails.employmentType,
        location: jdDetails.location,
        status: jdDetails.status,
        objective: jdDetails.objective,
        responsibilities: JSON.stringify(jdDetails.responsibilities),
        education: jdDetails.education,
        technical_skills: JSON.stringify(jdDetails.technicalSkills),
        soft_skills: JSON.stringify(jdDetails.softSkills),
        certifications: JSON.stringify(jdDetails.certifications),
        kpis: JSON.stringify(jdDetails.kpis),
        raci_role: jdDetails.raciRole
      };

      try {
        if (existingDb && existingDb.id) {
          await fetch(`/api/job_descriptions/${existingDb.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch('/api/job_descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
            body: JSON.stringify(payload)
          });
        }
      } catch (e) {}
    }

    localStorage.setItem('systo_custom_jds', JSON.stringify(customJDsMap));
  } catch (err) {
    console.error('Failed to sync JDs for department object:', err);
  }
};

export const saveDepartmentAPI = async (deptData: any, currentUserId?: string | number) => {
  const payload = {
    name: deptData.name,
    description: deptData.description || '',
    department_head_id: deptData.department_head_id ? parseInt(deptData.department_head_id) : null,
    teams: typeof deptData.teams === 'string' ? deptData.teams : JSON.stringify(deptData.teams || []),
    job_titles: typeof deptData.job_titles === 'string' ? deptData.job_titles : JSON.stringify(deptData.job_titles || [])
  };

  const deptId = deptData.id;
  const method = deptId ? 'PUT' : 'POST';
  const url = deptId ? `/api/departments/${deptId}` : '/api/departments';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': currentUserId?.toString() || '1'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || 'Failed to save department');
  }

  await syncJDsForDeptObject(deptData);
  return await res.json();
};

export const deleteDepartmentAPI = async (deptId: number | string, currentUserId?: string | number) => {
  const res = await fetch(`/api/departments/${deptId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': currentUserId?.toString() || '1'
    }
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || 'Failed to delete department');
  }

  return true;
};
