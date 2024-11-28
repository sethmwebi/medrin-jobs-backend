/** @format */

import { InferSchemaType, model, Schema, Types } from "mongoose";
import job from "./job";

const jobApplicationSchema = new Schema({
  jobSeeker_id: {
    type: String,
    required: true,
  },
  job_id: {
    type: Types.ObjectId,
    ref: "jobs",
    required: true,
  },
  employer_id: {
    type: Types.ObjectId,
    ref: "jobs",
    required: true,
  },
  jobSeeker_firstname: {
    type: String,
    required: true,
  },
  jobSeeker_lastname: {
    type: String,
    required: true,
  },
  jobSeeker_email: {
    type: String,
    required: true,
  },
  jobSeeker_phone: {
    type: String,
    required: true,
  },
  jobSeeker_country: {
    type: String,
    required: true,
  },

  application_status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  application_date: {
    type: Date,
    default: Date.now,
  },
  jobSeeker_resume: {
    type: String,
    required: true
  },
  jobSeeker_coverLetter: {
    type: String,
    required: true
  },
  jobSeeker_skills_summary: {
    type: String,
    required: true
  },
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
}
});

type JobApplication = InferSchemaType<typeof jobApplicationSchema>;

export default model<JobApplication>("JobApplication", jobApplicationSchema);
