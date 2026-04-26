import { Project } from "../models/index.js";
import { sendError } from "../utils/http.js";

export const getProjects = async (_req, res) => {
  try {
    const projects = await Project.findAll({ order: [["name", "ASC"]] });
    return res.json(projects);
  } catch (error) {
    return sendError(res, error, "Failed to fetch projects");
  }
};

export const createProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({ name: name.trim() });
    return res.status(201).json(project);
  } catch (error) {
    return sendError(res, error, "Failed to create project");
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.destroy();
    return res.json({ message: "Project removed successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete project");
  }
};
