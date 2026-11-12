import { Router } from "express";
import { WebSocketServer } from "ws";
import * as trainingController from "./training.controller.js";

export default function trainingRoutes(wss: WebSocketServer) {
  const router = Router();

  // Courses
  router.get("/master-data", trainingController.getFullTrainingData);
  router.get("/courses", trainingController.getCourses);
  router.post("/courses", trainingController.createCourse);
  router.get("/courses/:id", trainingController.getCourseDetails);
  router.put("/courses/:id", trainingController.updateCourse);
  router.delete("/courses/:id", trainingController.deleteCourse);

  // Modules & Lessons
  router.get("/courses/:id/modules", trainingController.getCourseModules);
  router.post("/modules", trainingController.createModule);
  router.put("/modules/:id", trainingController.updateModule);
  router.delete("/modules/:id", trainingController.deleteModule);
  router.post("/lessons", trainingController.createLesson);
  router.put("/lessons/:id", trainingController.updateLesson);
  router.delete("/lessons/:id", trainingController.deleteLesson);

  // Quizzes
  router.get("/quizzes", trainingController.getQuizzes);
  router.get("/quizzes/:id", trainingController.getQuiz);
  router.post("/quizzes", trainingController.createQuiz);
  router.put("/quizzes/:id", trainingController.updateQuiz);
  router.delete("/quizzes/:id", trainingController.deleteQuiz);
  router.post("/quizzes/:id/submit", trainingController.submitQuiz);

  // Enrollments & Progress
  router.get("/my-learning", trainingController.getMyLearning);
  router.get("/enrollments", trainingController.getAllEnrollments);
  router.post("/enroll", trainingController.enrollUser);
  router.post("/record", trainingController.recordTraining);
  router.put("/enrollments/:id", trainingController.updateEnrollment);
  router.delete("/enrollments/:id", trainingController.deleteEnrollment);
  router.post("/lessons/:id/complete", trainingController.completeLesson);
  
  // Analytics
  router.get("/analytics", trainingController.getTrainingAnalytics);

  // Certificates
  router.get("/certificates/:id", trainingController.getCertificate);

  return router;
}
