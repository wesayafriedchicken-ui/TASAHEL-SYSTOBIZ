import { Request, Response } from "express";
import { pool } from "../../db/schema.js";
import { generateCertificate } from "../../utils/certificateGenerator.js";
import { automationService } from "../../services/automation.service.js";

const logAudit = async (userId: number | null, action: string, type: string, id: number | null, details: string) => {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
      [userId, action, type, id, details]
    );
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT tc.*, 
             d.name as department_name, 
             s.title as sop_title,
             (SELECT count(*) FROM course_enrollments WHERE course_id = tc.id) as enrolled_count
      FROM training_courses tc
      LEFT JOIN departments d ON tc.department_id = d.id
      LEFT JOIN sops s ON tc.sop_id = s.id
      ORDER BY tc.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const { title, description, department_id, sop_id, passing_score, points_reward, start_date, end_date, modules, target_user_ids } = req.body;
  const user_id = (req as any).user?.id || null;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      "INSERT INTO training_courses (title, description, department_id, sop_id, passing_score, points_reward, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        title, 
        description, 
        department_id || null, 
        sop_id || null, 
        passing_score || 80, 
        points_reward || 10, 
        start_date || null, 
        end_date || null
      ]
    );
    
    const newCourse = result.rows[0];
    const courseId = newCourse.id;

    // Save target enrollments if provided
    if (target_user_ids && Array.isArray(target_user_ids)) {
      for (const t_uid of target_user_ids) {
        await client.query(
          "INSERT INTO course_enrollments (user_id, course_id, status) VALUES ($1, $2, 'Scheduled') ON CONFLICT DO NOTHING",
          [t_uid, courseId]
        );
      }
    }

    // Save modules if provided
    if (modules && Array.isArray(modules)) {
      for (const mod of modules) {
        const modResult = await client.query(
          "INSERT INTO training_modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING id",
          [courseId, mod.title, mod.order_index || 0]
        );
        const moduleId = modResult.rows[0].id;

        if (mod.lessons && Array.isArray(mod.lessons)) {
          for (const lesson of mod.lessons) {
            await client.query(
              "INSERT INTO training_lessons (module_id, title, content_type, content_url, content_body, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
              [moduleId, lesson.title, lesson.content_type || 'text', lesson.content_url || null, lesson.content_body || '', lesson.order_index || 0]
            );
          }
        }

        if (mod.quiz) {
          let quizId;
          const existingQuizId = mod.quiz.id || mod.quiz.quiz_id;

          if (existingQuizId) {
            quizId = existingQuizId;
            await client.query(
              "UPDATE training_quizzes SET course_id = $1, module_id = $2 WHERE id = $3",
              [courseId, moduleId, quizId]
            );
          } else {
            const quizResult = await client.query(
              "INSERT INTO training_quizzes (course_id, module_id, title) VALUES ($1, $2, $3) RETURNING id",
              [courseId, moduleId, mod.quiz.title || 'Module Quiz']
            );
            quizId = quizResult.rows[0].id;

            if (mod.quiz.questions && Array.isArray(mod.quiz.questions)) {
              for (const q of mod.quiz.questions) {
                await client.query(
                  "INSERT INTO training_questions (quiz_id, question_text, question_type, correct_answer, options) VALUES ($1, $2, $3, $4, $5)",
                  [quizId, q.question_text, q.question_type || 'multiple_choice', q.correct_answer, JSON.stringify(q.options || [])]
                );
              }
            }
          }
        }
      }
    }

    await logAudit(user_id, 'CREATE', 'training_course', courseId, `Created course: ${title}`);
    await client.query('COMMIT');
    await automationService.trigger('training:course:created', newCourse);
    res.status(201).json(newCourse);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error creating course:", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getCourseDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id } = req.query;
  try {
    const courseResult = await pool.query("SELECT * FROM training_courses WHERE id = $1", [id]);
    if (courseResult.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    const course = courseResult.rows[0];

    const enrollments = await pool.query("SELECT user_id FROM course_enrollments WHERE course_id = $1", [id]);
    course.target_user_ids = enrollments.rows.map(r => r.user_id);

    const modules = await pool.query(`
      SELECT tm.*, ss.step_description 
      FROM training_modules tm
      LEFT JOIN sop_steps ss ON tm.sop_step_id = ss.id
      WHERE tm.course_id = $1
      ORDER BY tm.order_index ASC
    `, [id]);

    for (let mod of modules.rows) {
      const lessons = await pool.query(`
        SELECT tl.*, 
               CASE WHEN tlp.id IS NOT NULL THEN true ELSE false END as is_completed
        FROM training_lessons tl
        LEFT JOIN course_enrollments te ON te.course_id = $3 AND te.user_id = $2
        LEFT JOIN training_lesson_progress tlp ON tl.id = tlp.lesson_id AND tlp.enrollment_id = te.id
        WHERE tl.module_id = $1 
        ORDER BY tl.order_index ASC
      `, [mod.id, user_id || null, id]);
      mod.lessons = lessons.rows;
      
      const quiz = await pool.query("SELECT * FROM training_quizzes WHERE module_id = $1", [mod.id]);
      mod.quiz = quiz.rows[0] || null;
      if (mod.quiz) {
        const questions = await pool.query("SELECT * FROM training_questions WHERE quiz_id = $1", [mod.quiz.id]);
        mod.quiz.questions = questions.rows;
        
        if (user_id) {
          const attempt = await pool.query("SELECT * FROM training_quiz_attempts WHERE quiz_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1", [mod.quiz.id, user_id]);
          mod.quiz.last_attempt = attempt.rows[0] || null;
        }
      }
    }

    res.json({ ...course, modules: modules.rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const completeLesson = async (req: Request, res: Response) => {
  const { id } = req.params; // lesson_id
  const { enrollment_id, user_id } = req.body;
  try {
    // Check if course is linked to an SOP and if user has acknowledged it
    const courseData = await pool.query(`
      SELECT tc.sop_id 
      FROM training_lessons tl
      JOIN training_modules tm ON tl.module_id = tm.id
      JOIN training_courses tc ON tm.course_id = tc.id
      WHERE tl.id = $1
    `, [id]);

    if (courseData.rows[0]?.sop_id) {
      const ack = await pool.query(
        "SELECT id FROM sop_acknowledgments WHERE sop_id = $1 AND user_id = $2",
        [courseData.rows[0].sop_id, user_id]
      );
      if (ack.rows.length === 0) {
        return res.status(403).json({ error: "You must read and acknowledge the linked SOP before completing this training." });
      }
    }

    await pool.query(`
      INSERT INTO training_lesson_progress (enrollment_id, lesson_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [enrollment_id, id]);
    await automationService.trigger('training:lesson:completed', { enrollment_id, lesson_id: id, user_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, department_id, passing_score, points_reward, start_date, end_date, modules, target_user_ids } = req.body;
  const user_id = (req as any).user?.id || null;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Update Core Course Info
    const result = await client.query(
      `UPDATE training_courses 
       SET title = $1, description = $2, status = $3, department_id = $4, 
           passing_score = $5, points_reward = $6, start_date = $7, end_date = $8,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [
        title, 
        description, 
        status || 'Published', 
        department_id || null, 
        passing_score || 80, 
        points_reward || 10, 
        start_date || null, 
        end_date || null, 
        id
      ]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Course not found" });
    }

    // 2. Update Target Enrollments if provided
    if (target_user_ids && Array.isArray(target_user_ids)) {
      // Remove old in-progress/scheduled enrollments that are no longer in the list?
      // For now just add new ones
      for (const t_uid of target_user_ids) {
        await client.query(
          "INSERT INTO course_enrollments (user_id, course_id, status) VALUES ($1, $2, 'Scheduled') ON CONFLICT DO NOTHING",
          [t_uid, id]
        );
      }
    }

    // 3. Recursively Refresh Modules if provided
    if (modules && Array.isArray(modules)) {
      // Delete existing modules (cascades to lessons/quizzes)
      await client.query("DELETE FROM training_modules WHERE course_id = $1", [id]);
      
      for (const mod of modules) {
        const modResult = await client.query(
          "INSERT INTO training_modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING id",
          [id, mod.title, mod.order_index || 0]
        );
        const moduleId = modResult.rows[0].id;

        if (mod.lessons && Array.isArray(mod.lessons)) {
          for (const lesson of mod.lessons) {
            await client.query(
              "INSERT INTO training_lessons (module_id, title, content_type, content_url, content_body, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
              [moduleId, lesson.title, lesson.content_type || 'text', lesson.content_url || null, lesson.content_body || '', lesson.order_index || 0]
            );
          }
        }

        if (mod.quiz) {
          let quizId;
          const existingQuizId = mod.quiz.id || mod.quiz.quiz_id;

          if (existingQuizId) {
            quizId = existingQuizId;
            await client.query(
              "UPDATE training_quizzes SET course_id = $1, module_id = $2 WHERE id = $3",
              [id, moduleId, quizId]
            );
          } else {
            const quizResult = await client.query(
              "INSERT INTO training_quizzes (course_id, module_id, title) VALUES ($1, $2, $3) RETURNING id",
              [id, moduleId, mod.quiz.title || 'Module Quiz']
            );
            quizId = quizResult.rows[0].id;

            if (mod.quiz.questions && Array.isArray(mod.quiz.questions)) {
              for (const q of mod.quiz.questions) {
                await client.query(
                  "INSERT INTO training_questions (quiz_id, question_text, question_type, correct_answer, options) VALUES ($1, $2, $3, $4, $5)",
                  [quizId, q.question_text, q.question_type || 'multiple_choice', q.correct_answer, JSON.stringify(q.options || [])]
                );
              }
            }
          }
        }
      }
    }

    await logAudit(user_id, 'UPDATE', 'training_course', Number(id), `Updated course: ${title}`);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error updating course:", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();
  
  console.log(`[DELETE COURSE] Request to delete course ID: ${id} by User ID: ${user_id}`);
  
  try {
    await client.query('BEGIN');
    const course = await client.query("SELECT title FROM training_courses WHERE id = $1", [id]);
    if (course.rows.length === 0) {
      console.warn(`[DELETE COURSE] Course ${id} not found`);
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Course not found" });
    }
    
    const courseTitle = course.rows[0].title;
    
    // Explicitly delete related records to bypass any potential cascade issues
    console.log(`[DELETE COURSE] Deleting related records for course ${id}...`);
    
    // Enrollments -> Progress
    await client.query("DELETE FROM training_lesson_progress WHERE enrollment_id IN (SELECT id FROM course_enrollments WHERE course_id = $1)", [id]);
    
    // Quizzes -> Attempts -> Questions
    await client.query("DELETE FROM training_quiz_attempts WHERE quiz_id IN (SELECT id FROM training_quizzes WHERE course_id = $1)", [id]);
    await client.query("DELETE FROM training_questions WHERE quiz_id IN (SELECT id FROM training_quizzes WHERE course_id = $1)", [id]);
    await client.query("DELETE FROM training_quizzes WHERE course_id = $1", [id]);
    
    // Modules -> Lessons
    await client.query("DELETE FROM training_lessons WHERE module_id IN (SELECT id FROM training_modules WHERE course_id = $1)", [id]);
    await client.query("DELETE FROM training_modules WHERE course_id = $1", [id]);
    
    // Enrollments
    await client.query("DELETE FROM course_enrollments WHERE course_id = $1", [id]);
    
    // Finally the course
    const result = await client.query("DELETE FROM training_courses WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
       throw new Error("Failed to delete main course record");
    }

    await logAudit(user_id, 'DELETE', 'training_course', Number(id), `Deleted course: ${courseTitle}`);
    await client.query('COMMIT');
    
    console.log(`[DELETE COURSE] Successfully deleted course: ${courseTitle} (${id})`);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[DELETE COURSE ERROR] for course ${id}:`, err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getCourseModules = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM training_modules WHERE course_id = $1 ORDER BY order_index ASC", [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createModule = async (req: Request, res: Response) => {
  const { course_id, title, sop_step_id, order_index } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO training_modules (course_id, title, sop_step_id, order_index) VALUES ($1, $2, $3, $4) RETURNING *",
      [course_id, title, sop_step_id, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, sop_step_id, order_index } = req.body;
  const user_id = (req as any).user?.id || null;
  try {
    const result = await pool.query(
      "UPDATE training_modules SET title = $1, sop_step_id = $2, order_index = $3 WHERE id = $4 RETURNING *",
      [title, sop_step_id, order_index, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Module not found" });
    await logAudit(user_id, 'UPDATE', 'training_module', Number(id), `Updated module: ${title}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const module = await client.query("SELECT title FROM training_modules WHERE id = $1", [id]);
    if (module.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Module not found" });
    }
    await client.query("DELETE FROM training_modules WHERE id = $1", [id]);
    await logAudit(user_id, 'DELETE', 'training_module', Number(id), `Deleted module: ${module.rows[0].title}`);
    await client.query('COMMIT');
    res.json({ message: "Module deleted successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error deleting module:", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const createLesson = async (req: Request, res: Response) => {
  const { module_id, module_ids, title, content_type, content_url, content_body, order_index } = req.body;
  const user_id = (req as any).user?.id || null;
  try {
    const idsToInsert = Array.isArray(module_ids) 
      ? module_ids 
      : Array.isArray(module_id) 
        ? module_id 
        : [module_id];

    let lastInserted = null;
    for (const mId of idsToInsert) {
      if (!mId) continue;
      const result = await pool.query(
        "INSERT INTO training_lessons (module_id, title, content_type, content_url, content_body, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [mId, title, content_type, content_url, content_body, order_index || 0]
      );
      lastInserted = result.rows[0];
      await logAudit(user_id, 'CREATE', 'training_lesson', lastInserted.id, `Created lesson: ${title}`);
    }
    res.status(201).json(lastInserted || { success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content_type, content_url, content_body, order_index } = req.body;
  const user_id = (req as any).user?.id || null;
  try {
    const result = await pool.query(
      "UPDATE training_lessons SET title = $1, content_type = $2, content_url = $3, content_body = $4, order_index = $5 WHERE id = $6 RETURNING *",
      [title, content_type, content_url, content_body, order_index, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Lesson not found" });
    await logAudit(user_id, 'UPDATE', 'training_lesson', Number(id), `Updated lesson: ${title}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();
  
  console.log(`[DELETE LESSON] Request to delete lesson ID: ${id} by User ID: ${user_id}`);
  
  try {
    await client.query('BEGIN');
    const lesson = await client.query("SELECT title FROM training_lessons WHERE id = $1", [id]);
    if (lesson.rows.length === 0) {
      console.warn(`[DELETE LESSON] Lesson ${id} not found`);
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Lesson not found" });
    }
    
    const lessonTitle = lesson.rows[0].title;
    
    // Explicitly delete progress
    await client.query("DELETE FROM training_lesson_progress WHERE lesson_id = $1", [id]);
    
    // Delete the lesson
    const result = await client.query("DELETE FROM training_lessons WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      throw new Error("Failed to delete main lesson record");
    }

    await logAudit(user_id, 'DELETE', 'training_lesson', Number(id), `Deleted lesson: ${lessonTitle}`);
    await client.query('COMMIT');
    
    console.log(`[DELETE LESSON] Successfully deleted lesson: ${lessonTitle} (${id})`);
    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[DELETE LESSON ERROR] for lesson ${id}:`, err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const createQuiz = async (req: Request, res: Response) => {
  const { 
    course_id, 
    module_id, 
    title, 
    description, 
    department_id, 
    passing_score, 
    end_date, 
    questions 
  } = req.body;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const quizResult = await client.query(
      "INSERT INTO training_quizzes (course_id, module_id, title, description, department_id, passing_score, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [course_id || null, module_id || null, title, description || null, department_id || null, passing_score || 80, end_date || null]
    );
    const quizId = quizResult.rows[0].id;

    if (questions && Array.isArray(questions)) {
      for (let q of questions) {
        await client.query(
          "INSERT INTO training_questions (quiz_id, question_text, question_type, correct_answer, options, explanation) VALUES ($1, $2, $3, $4, $5, $6)",
          [quizId, q.question_text, q.question_type, q.correct_answer, JSON.stringify(q.options || []), q.explanation || null]
        );
      }
    }

    await logAudit(user_id, 'CREATE', 'training_quiz', quizId, `Created assessment: ${title}`);
    await client.query('COMMIT');
    
    res.status(201).json(quizResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("[CREATE QUIZ ERROR]", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getQuizzes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT tq.*, tc.title as course_title, d.name as department_name
      FROM training_quizzes tq
      LEFT JOIN training_courses tc ON tq.course_id = tc.id
      LEFT JOIN departments d ON tq.department_id = d.id
      ORDER BY tq.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateQuiz = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    department_id, 
    passing_score, 
    end_date, 
    questions 
  } = req.body;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    await client.query(
      "UPDATE training_quizzes SET title = $1, description = $2, department_id = $3, passing_score = $4, end_date = $5 WHERE id = $6",
      [title, description || null, department_id || null, passing_score || 80, end_date || null, id]
    );

    // Refresh questions
    await client.query("DELETE FROM training_questions WHERE quiz_id = $1", [id]);
    if (questions && Array.isArray(questions)) {
      for (let q of questions) {
        await client.query(
          "INSERT INTO training_questions (quiz_id, question_text, question_type, correct_answer, options, explanation) VALUES ($1, $2, $3, $4, $5, $6)",
          [id, q.question_text, q.question_type, q.correct_answer, JSON.stringify(q.options || []), q.explanation || null]
        );
      }
    }

    await logAudit(user_id, 'UPDATE', 'training_quiz', Number(id), `Updated assessment: ${title}`);
    await client.query('COMMIT');
    
    res.json({ message: "Quiz updated successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("[UPDATE QUIZ ERROR]", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const deleteQuiz = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user_id = (req as any).user?.id || null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const quiz = await client.query("SELECT title FROM training_quizzes WHERE id = $1", [id]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: "Quiz not found" });

    await client.query("DELETE FROM training_quizzes WHERE id = $1", [id]);
    await logAudit(user_id, 'DELETE', 'training_quiz', Number(id), `Deleted assessment: ${quiz.rows[0].title}`);
    await client.query('COMMIT');
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const quiz = await pool.query("SELECT * FROM training_quizzes WHERE id = $1", [id]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: "Quiz not found" });

    const questions = await pool.query("SELECT * FROM training_questions WHERE quiz_id = $1", [id]);
    res.json({ ...quiz.rows[0], questions: questions.rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id, answers } = req.body; // answers: { question_id: answer }
  try {
    const questions = await pool.query("SELECT * FROM training_questions WHERE quiz_id = $1", [id]);
    let correctCount = 0;
    
    for (let q of questions.rows) {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.rows.length) * 100);
    
    // Get passing score from course
    const quizData = await pool.query(`
      SELECT tc.passing_score, tc.id as course_id, tc.points_reward 
      FROM training_quizzes tq
      JOIN training_courses tc ON tq.course_id = tc.id
      WHERE tq.id = $1
    `, [id]);
    
    const passingScore = quizData.rows[0].passing_score;
    const passed = score >= passingScore;

    if (!passed) {
      const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [user_id]);
      await pool.query(
        "INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)",
        ["Training Failure", `${userRes.rows[0].name} failed the quiz for "${quizData.rows[0].course_id}" with a score of ${score}%`, "warning"]
      );
      await automationService.trigger('training:quiz:failed', { user_id, quiz_id: id, score, course_id: quizData.rows[0].course_id });
    } else {
      await automationService.trigger('training:quiz:passed', { user_id, quiz_id: id, score, course_id: quizData.rows[0].course_id });
      await automationService.trigger('training:course:completed', { user_id, course_id: quizData.rows[0].course_id, score });
    }

    await pool.query(
      "INSERT INTO training_quiz_attempts (user_id, quiz_id, score, passed) VALUES ($1, $2, $3, $4)",
      [user_id, id, score, passed]
    );

    if (passed) {
      await pool.query(
        "UPDATE course_enrollments SET score = $1, status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND course_id = $3",
        [score, user_id, quizData.rows[0].course_id]
      );

      // Award points if first time passing
      const previousPasses = await pool.query(
        "SELECT count(*) FROM training_quiz_attempts WHERE user_id = $1 AND quiz_id = $2 AND passed = TRUE",
        [user_id, id]
      );

      if (parseInt(previousPasses.rows[0].count) === 1) {
        await pool.query(
          "UPDATE users SET training_points = training_points + $1 WHERE id = $2",
          [quizData.rows[0].points_reward, user_id]
        );
        
        // Update KPI if exists
        await pool.query(
          "UPDATE kpis SET actual_value = actual_value + 1 WHERE department_id = (SELECT department_id FROM users WHERE id = $1) AND source = 'Training'",
          [user_id]
        );
      }
    }

    res.json({ score, passed, correctCount, total: questions.rows.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getMyLearning = async (req: Request, res: Response) => {
  const { user_id, department_id } = req.query;
  if (!user_id || user_id === 'undefined') {
    return res.json([]);
  }
  try {
    const result = await pool.query(`
      SELECT tc.id as course_id, tc.title, tc.description, tc.points_reward, tc.category, tc.end_date,
             d.name as department_name, te.status, te.score, te.cost, te.created_at as enrolled_at, te.completed_at, te.id as enrollment_id
      FROM training_courses tc
      LEFT JOIN course_enrollments te ON tc.id = te.course_id AND te.user_id = $1
      LEFT JOIN departments d ON tc.department_id = d.id
      WHERE tc.department_id = $2 OR te.user_id = $1
      ORDER BY tc.created_at DESC
    `, [user_id, department_id || null]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const enrollUser = async (req: Request, res: Response) => {
  const { user_id, course_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO course_enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
      [user_id, course_id]
    );
    const enrollment = result.rows[0];
    if (enrollment) {
      await automationService.trigger('training:user:enrolled', enrollment);
    }
    res.status(201).json(enrollment || { message: "Already enrolled" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getFullTrainingData = async (req: Request, res: Response) => {
  try {
    // Check if status column exists in training_courses to avoid crash while migration propagates
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'training_courses' AND column_name = 'status'
    `);
    const hasStatus = columnCheck.rows.length > 0;

    // This master query joins the 11 key tables for a comprehensive overview
    const result = await pool.query(`
      SELECT 
        tc.id as course_id, 
        tc.title as course_title,
        ${hasStatus ? 'tc.status' : "'Draft'"} as course_status,
        d.name as department_name,
        s.title as sop_title,
        tm.id as module_id,
        tm.title as module_title,
        tl.id as lesson_id,
        tl.title as lesson_title,
        tq.id as quiz_id,
        tq.title as quiz_title,
        (SELECT count(*) FROM training_questions tqn WHERE tqn.quiz_id = tq.id) as questions_count,
        (SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = tc.id) as total_enrollments,
        (SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = tc.id AND ce.status ILIKE 'completed') as total_completions,
        (SELECT count(*) FROM training_quiz_attempts ta WHERE ta.quiz_id = tq.id AND ta.passed = true) as total_quiz_passes
      FROM training_courses tc
      LEFT JOIN departments d ON tc.department_id = d.id
      LEFT JOIN sops s ON tc.sop_id = s.id
      LEFT JOIN training_modules tm ON tm.course_id = tc.id
      LEFT JOIN training_lessons tl ON tl.module_id = tm.id
      LEFT JOIN training_quizzes tq ON tq.module_id = tm.id
      ORDER BY tc.id, tm.order_index, tl.order_index
    `);

    console.log(`📊 MASTER QUERY EXECUTED: Fetched ${result.rows.length} joined training records.`);
    res.json(result.rows);
  } catch (err) {
    console.error("Master Query Error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getTrainingAnalytics = async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        count(*) as total_enrollments,
        count(CASE WHEN ce.status = 'completed' THEN 1 END) as total_completions,
        COALESCE(avg(ce.score), 0) as avg_score,
        count(CASE WHEN ce.status = 'failed' THEN 1 END) as total_failures,
        count(CASE WHEN ce.status = 'In Progress' AND tc.end_date < CURRENT_TIMESTAMP THEN 1 END) as overdue_count
      FROM course_enrollments ce
      JOIN training_courses tc ON ce.course_id = tc.id
    `);
    
    const activeTrainees = await pool.query(`
      SELECT count(DISTINCT user_id) as count 
      FROM course_enrollments 
      WHERE status IN ('In Progress', 'Scheduled')
    `);
    
    const departmentStats = await pool.query(`
      SELECT d.id, d.name, count(te.id) as enrollment_count, COALESCE(avg(te.score), 0) as avg_score
      FROM course_enrollments te
      JOIN training_courses tc ON te.course_id = tc.id
      JOIN departments d ON tc.department_id = d.id
      GROUP BY d.id, d.name
    `);

    const overview = stats.rows[0] && stats.rows[0].total_enrollments !== null
      ? { 
          total_enrollments: parseInt(stats.rows[0].total_enrollments) || 0,
          total_completions: parseInt(stats.rows[0].total_completions) || 0,
          avg_score: parseFloat(stats.rows[0].avg_score) || 0,
          total_failures: parseInt(stats.rows[0].total_failures) || 0,
          overdue_count: parseInt(stats.rows[0].overdue_count) || 0,
          active_trainees: parseInt(activeTrainees.rows[0].count) || 0 
        }
      : { total_enrollments: 0, total_completions: 0, avg_score: 0, total_failures: 0, overdue_count: 0, active_trainees: 0 };

    res.json({
      overview,
      byDepartment: departmentStats.rows || []
    });
  } catch (err) {
    console.error("Training Analytics Error:", err);
    res.status(500).json({ 
      error: (err as Error).message,
      overview: { total_enrollments: 0, total_completions: 0, avg_score: 0, total_failures: 0, overdue_count: 0, active_trainees: 0 },
      byDepartment: []
    });
  }
};

export const getCertificate = async (req: Request, res: Response) => {
  const { id } = req.params; // enrollment_id
  try {
    const enrollment = await pool.query(`
      SELECT te.*, tc.title as course_title, u.name as user_name
      FROM course_enrollments te
      JOIN training_courses tc ON te.course_id = tc.id
      JOIN users u ON te.user_id = u.id
      WHERE te.id = $1 AND te.status = 'completed'
    `, [id]);

    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found or course not completed" });
    }

    const { user_name, course_title, completed_at } = enrollment.rows[0];
    const date = new Date(completed_at).toLocaleDateString();

    const pdfBytes = await generateCertificate(user_name, course_title, date);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=certificate_${id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getAllEnrollments = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT ce.*, u.name as user_name, u.email as user_email, tc.title as course_title, d.name as department_name
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      JOIN training_courses tc ON ce.course_id = tc.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY ce.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const recordTraining = async (req: Request, res: Response) => {
  const { user_id, course_title, course_id, status, score, cost, completed_at, category } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let finalCourseId = course_id;
    if (!finalCourseId && course_title) {
      // Find or create course
      const courseCheck = await client.query("SELECT id FROM training_courses WHERE title = $1", [course_title]);
      if (courseCheck.rows.length > 0) {
        finalCourseId = courseCheck.rows[0].id;
      } else {
        const insertCourse = await client.query(
          "INSERT INTO training_courses (title, category, status) VALUES ($1, $2, 'Published') RETURNING id",
          [course_title, category || 'Upcoming Training']
        );
        finalCourseId = insertCourse.rows[0].id;
      }
    }

    if (!finalCourseId) {
      throw new Error("Course ID or Title is required");
    }

    // Now insert or update enrollment
    const enrollResult = await client.query(`
      INSERT INTO course_enrollments (user_id, course_id, status, score, cost, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, course_id) DO UPDATE SET
        status = EXCLUDED.status,
        score = EXCLUDED.score,
        cost = EXCLUDED.cost,
        completed_at = EXCLUDED.completed_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      user_id,
      finalCourseId,
      status || 'Completed',
      score !== undefined ? score : null,
      cost !== undefined ? cost : 0,
      completed_at ? new Date(completed_at) : null
    ]);

    await client.query('COMMIT');
    res.status(201).json(enrollResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

export const updateEnrollment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, score, cost, completed_at } = req.body;
  try {
    const result = await pool.query(`
      UPDATE course_enrollments 
      SET status = $1, score = $2, cost = $3, completed_at = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [status, score, cost, completed_at ? new Date(completed_at) : null, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM course_enrollments WHERE id = $1", [id]);
    res.json({ message: "Enrollment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

