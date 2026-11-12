import { pool } from "../db/schema.js";

export const trainingService = {
  async hasPassedTraining(userId: number, courseId: number): Promise<boolean> {
    if (!courseId) return true; // No training required
    
    const result = await pool.query(
      "SELECT status FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
      [userId, courseId]
    );
    
    return result.rows.length > 0 && result.rows[0].status === 'completed';
  },

  async checkStepPermission(userId: number, sopStepId: number): Promise<boolean> {
    const step = await pool.query(
      "SELECT required_course_id FROM sop_steps WHERE id = $1",
      [sopStepId]
    );
    
    if (step.rows.length === 0 || !step.rows[0].required_course_id) {
      return true;
    }
    
    return this.hasPassedTraining(userId, step.rows[0].required_course_id);
  },

  async autoEnrollUser(userId: number, departmentId: number) {
    // Find all courses for this department
    const courses = await pool.query(
      "SELECT id FROM training_courses WHERE department_id = $1",
      [departmentId]
    );
    
    for (let course of courses.rows) {
      await pool.query(
        "INSERT INTO course_enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, course.id]
      );
    }
  }
};
