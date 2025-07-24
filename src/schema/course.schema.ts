import { z } from "zod";

export const courseFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  briefDescription: z
    .string()
    .min(1, "Brief description is required")
    .max(1000, "Brief description must be less than 1000 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    required_error: "Level is required",
  }),
  price: z
    .number()
    .min(1, "Price must be positive")
    .max(999.99, "Price must be less than $1000"),
  requirements: z
    .array(z.string().min(1, "Requirement cannot be empty"))
    .min(1, "At least one requirement is required")
    .max(10, "Maximum of 10 requirements allowed"),
  objectives: z
    .array(z.string().min(1, "Objective cannot be empty"))
    .min(1, "At least one objective is required")
    .max(10, "Maximum of 10 objectives allowed"),
  language: z.string().min(1, "Language is required"),
});

export const createCategorySchema = z.object({
  name: z.string().min(3, "Category name is required"),
});

export const sectionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(300, "Description must be less than 300 characters"),
  order: z.number().min(1, "Order must be at least 1").optional(),
});

export const lessonSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(300, "Description must be less than 300 characters"),
  duration: z
    .number()
    .positive("Duration must be a positive number")
    .int("Duration must be an integer"),
  videoUrl: z.string().url("Invalid video URL"),
  fileName: z.string(),
  order: z.number().min(1, "Order must be at least 1").optional(),
});

export const courseDetailsSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  price: z.number().min(0, "Price must be a positive number"),
  description: z.string().min(1, "Description is required"),
  briefDescription: z.string().min(1, "Brief description is required"),
  requirements: z.array(z.string().min(1, "Requirement cannot be empty")),
  objectives: z.array(z.string().min(1, "Objective cannot be empty")),
  language: z.string().min(1, "Language is required"),
  category: z.object({
    name: z.string().min(1, "Category is required"),
  }),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    required_error: "Level is required",
    invalid_type_error:
      "Level must be one of beginner, intermediate, or advanced",
  }),
});

export const updateSettingsSchema = z.object({
  thumbnailUrl: z.string().url("Invalid thumbnail URL"),
  thumbnailId: z.string({ required_error: "Thumbnail ID is required" }),
  fileName: z.string({ required_error: "File name is required" }),
});
