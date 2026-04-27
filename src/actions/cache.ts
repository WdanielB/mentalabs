"use server";

import { updateTag } from 'next/cache';
import { CACHE_TAGS } from '../lib/cache/tags';

export async function revalidateAdminCache(): Promise<void> {
  updateTag(CACHE_TAGS.ADMIN_STATS);
  updateTag(CACHE_TAGS.ADMIN_SPECIALISTS);
  updateTag(CACHE_TAGS.ADMIN_PATIENTS);
  updateTag(CACHE_TAGS.ADMIN_ASSIGNMENTS);
  updateTag(CACHE_TAGS.ADMIN_REQUESTS);
  updateTag(CACHE_TAGS.ADMIN_APPOINTMENTS);
}

export async function revalidateSpecialistPatientsCache(): Promise<void> {
  updateTag(CACHE_TAGS.SPECIALIST_PATIENTS);
  updateTag(CACHE_TAGS.PATIENT_TIMELINE);
  updateTag(CACHE_TAGS.PATIENT_EXAMS);
  updateTag(CACHE_TAGS.PATIENT_SESSIONS);
}

export async function revalidateExamsCache(): Promise<void> {
  updateTag(CACHE_TAGS.EXAMS);
  updateTag(CACHE_TAGS.EXAM_RULES);
}
