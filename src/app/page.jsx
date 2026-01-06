"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/components/ClientLayout";
import axiosClient from "@/lib/axios_client";

const ResourceTable = dynamic(() => import("@/components/ResourceTable"), {
  ssr: false,
  suspense: true,
});

export default function Dashboard() {
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedResourceType, setSelectedResourceType] = useState("");

  const { session } = useSession();

  // Set page title
  useEffect(() => {
    document.title = "Dashboard | lms";
  }, []);

  // Fetch semesters for user's course
  useEffect(() => {
    const abortController = new AbortController();

    const fetchSemesters = async () => {
      if (!session?.course_id) return;

      try {
        const { data } = await axiosClient.get(
          `/api/semesters?course_id=${session.course_id}`,
          {
            signal: abortController.signal,
          }
        );
        setSemesters(data);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching semesters:", error);
        }
      }
    };

    fetchSemesters();
    return () => abortController.abort();
  }, [session]);

  // Fetch subjects when semester changes
  useEffect(() => {
    if (!selectedSemesterId) {
      setSubjects([]);
      return;
    }

    const abortController = new AbortController();

    const fetchSubjects = async () => {
      try {
        const { data } = await axiosClient.get(
          `/api/subjects?semester_id=${selectedSemesterId}`,
          { signal: abortController.signal }
        );
        setSubjects(data);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching subjects:", error);
        }
      }
    };

    fetchSubjects();

    return () => abortController.abort();
  }, [selectedSemesterId]);

  return (
    <>
      <h1 className="text-lg md:text-xl p-2 font-bold">Homepage | lms</h1>
      <div className="p-2 flex flex-col md:flex-row gap-2 lg:flex-1/2 lg:gap-4 lg:max-w-4xl">
        {/* Semester Select */}
        <div className="flex-1 min-w-0 lg:max-w-[10vw]">
          <label className="block font-semibold mb-1 text-sm md:text-base">Semester</label>
          <select
            value={selectedSemesterId}
            onChange={(e) => {
              setSelectedSemesterId(e.target.value);
              setSelectedSubjectId("");
            }}
            className="border p-2 rounded w-full lg:max-w-max text-sm md:text-base"
          >
            <option value="">Select semester</option>
            {semesters.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.title}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Select */}
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-sm md:text-base">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="border p-2 rounded w-full lg:flex-1 text-sm md:text-base disabled:cursor-not-allowed"
            disabled={!selectedSemesterId}
          >
            <option value="">Select subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Resource Type */}
        <div className="flex-1 min-w-0">
          <label className="block font-semibold mb-1 text-sm md:text-base">Resource Type</label>
          <select
            value={selectedResourceType}
            onChange={(e) => setSelectedResourceType(e.target.value)}
            className="border p-2 rounded w-full lg:max-w-max text-sm md:text-base disabled:cursor-not-allowed"
            disabled={!selectedSubjectId}
          >
            <option value="" key="">
              All (Slides, QA, etc.)
            </option>
            <option value="slides">Slides</option>
            <option value="QA">Question Answers</option>
            <option value="QB">Question Bank</option>
            <option value="notes">Notes</option>
            <option value="assignment">Assignment</option>
            <option value="textbook">Textbook</option>
            <option value="PYQ">Previous Year Questions</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="mt-6 space-y-3" aria-label="Loading resources">
            <div className="h-10 w-64 bg-neutral-800/80 rounded animate-pulse" />
            <div className="h-6 w-full bg-neutral-800/80 rounded animate-pulse" />
            <div className="h-6 w-full bg-neutral-800/60 rounded animate-pulse" />
            <div className="h-6 w-full bg-neutral-800/40 rounded animate-pulse" />
          </div>
        }
      >
        <ResourceTable
          activeUnitId={null}
          semesterId={selectedSemesterId ? selectedSemesterId.toString() : null}
          subjectId={selectedSubjectId}
          resourceType={selectedResourceType}
        />
      </Suspense>
    </>
  );
}
