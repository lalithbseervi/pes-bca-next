"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axiosClient from "@/lib/axios_client";
import { useSession } from "@/components/ClientLayout";

const REQUIRED_FIELDS = ["course_id", "course_code", "current_semester", "current_sem_db"];

export default function ProfileCompletionModal() {
  const { session, setSession } = useSession();
  const pathname = usePathname();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const missing = useMemo(() => {
    if (!session) return [];
    return REQUIRED_FIELDS.filter((key) => !session[key]);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (pathname === "/authenticate") return;
    if (missing.length === 0) return;

    setSelectedCourseId(session.course_id || null);
    setSelectedSemester(session.current_semester || "");
    setVisible(true);

    // Fetch course catalog once when we need it
    (async () => {
      try {
        const { data } = await axiosClient.get("/api/courses");
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        setError("Unable to load courses. You can still try again.");
      }
    })();
  }, [session, missing.length, pathname]);

  if (!visible || !session) return null;

  const courseOptions = courses.map((c) => ({
    id: c.id,
    label: `${c.course_name} (${c.course_code})`,
    code: c.course_code,
  }));

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const course_id = selectedCourseId
        ? Number(selectedCourseId)
        : session.course_id || null;
      const course = courseOptions.find((c) => String(c.id) === String(course_id));
      const course_code = course?.code || session.course_code || null;
      const current_semester = selectedSemester
        ? Number(selectedSemester)
        : session.current_semester || 1;

      let current_sem_db = session.current_sem_db || null;
      if (course_id && current_semester) {
        try {
          const { data: semData } = await axiosClient.get(`/api/semesters?course_id=${course_id}`);
          const match = (semData || []).find(
            (sem) => String(sem.semester_number) === String(current_semester)
          );
          if (match) current_sem_db = match.id;
        } catch (err) {
          console.warn("Failed to resolve current_sem_db", err);
        }
      }

      const updatedSession = {
        ...session,
        course_id,
        course_code,
        current_semester,
        current_sem_db,
      };

      setSession(updatedSession);

      // Persist best-effort to backend so future logins reuse these details
      try {
        await axiosClient.post("/api/profile/", {
          course_id,
          current_semester,
        });
      } catch (err) {
        console.warn("Failed to persist profile completion", err);
      }

      setVisible(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 shadow-2xl p-6 space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Complete Your Profile</h2>
          <p className="text-sm text-gray-700 dark:text-neutral-300">
            We could not fetch all details automatically. Please fill the missing fields to continue.
          </p>
        </header>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">Program / Course</label>
          <select
            className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 p-3 text-sm hover:cursor-pointer"
            value={selectedCourseId || ""}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">Select your program</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">Current Semester</label>
          <select
            className="w-full rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 p-3 text-sm hover:cursor-pointer"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">Select semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded border border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 md:flex-row md:justify-start md:gap-3">
          <button
            className="rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:cursor-pointer hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            onClick={handleSave}
            disabled={loading || !selectedCourseId || !selectedSemester}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
