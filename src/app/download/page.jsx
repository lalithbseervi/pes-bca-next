"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/ClientLayout";
import axiosClient from "@/lib/axios_client";
import Select from "@/components/Select";

const Download = () => {
  const { session } = useSession();
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);

  const [semID, setSemID] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setsubjectName] = useState("");
  const [unitId, setUnitId] = useState("");

  const [resourceType, setResourceType] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [resources, setResources] = useState([]);
  const [showNoResources, setShowNoResources] = useState(false);

  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = "Download Resources | lms";
  }, []);

  /* fetch semesters */
  useEffect(() => {
    const abortController = new AbortController();

    const fetchSemesters = async () => {
      if (!session) return;
      setLoadingSemesters(true);
      try {
        const { data } = await axiosClient.get(
          `/api/semesters?course_id=${session?.course_id}`,
          {
            signal: abortController.signal,
          }
        );
        setSemesters(data);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingSemesters(false);
      }
    };

    fetchSemesters();
    return () => abortController.abort();
  }, [session]);

  /* fetch subjects */
  useEffect(() => {
    if (!semesters) {
      setSubjects([]);
      setSubjectId("");
      return;
    }
    const fetchSubjects = async () => {
      if (!session) return;
      if (subjects.length === 0) {
        setLoadingSubjects(true);
        try {
          const { data } = await axiosClient.get(`/api/subjects?semester_id=${session?.current_sem_db}`);
          setSubjects(data);
        } catch (error) {
          console.error("Failed to fetch subjects:", error);
        } finally {
          setLoadingSubjects(false);
        }
      }
    };
    fetchSubjects();
  }, [session, semesters, subjects.length]);

  /* fetch units by subjectId */
  useEffect(() => {
    if (!subjectId) {
      setUnits([]);
      setUnitId("");
      return;
    }

    (async () => {
      setLoadingUnits(true);
      try {
        const { data } = await axiosClient.get(`/api/units?subject_id=${subjectId}`);
        setUnits(data);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [subjectId]);

  // Fetch resources when active unit changes
  const handleDownloads = async () => {
    if (!unitId) return;

    setDownloading(true);
    try {
      // Bypass cached ETag responses for fresh downloads
      const url = `/api/resources?subject_id=${subjectId}&unit_id=${unitId}${
        resourceType ? `&resource_type=${resourceType}` : ""
      }&_ts=${Date.now()}`;
      const { data } = await axiosClient.get(url, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "If-None-Match": "\"0\"", // force bypass of 304
        },
      });

      setResources(data);

      if (!data || data.length === 0) {
        setShowNoResources(true);
        return;
      }

      const currentUnitId = unitId;
      const selectedUnit = units.find(
        (u) => String(u.id) === String(currentUnitId)
      );
      const folderUnitNumber = selectedUnit?.unit_number ?? currentUnitId;
      const courseCode = JSON.parse(
        localStorage.getItem("user_session")
      ).course_code;

      // Fetch all files in parallel instead of sequentially
      const downloadPromises = data.map(async (r) => {
        const storageKey = `${courseCode}/sem-${semID}/${subjectName}/unit-${folderUnitNumber}/${r.resource_type}/${r.filename}`;
        const downloadUrl = `/api/download?file=${storageKey}`;

        try {
          const { data: blob } = await axiosClient.get(downloadUrl, {
            responseType: 'blob',
          });
          const link = document.createElement("a");

          link.download = `${r.filename}`;
          const urlObject = URL.createObjectURL(blob);
          link.href = urlObject;
          link.click();
          URL.revokeObjectURL(urlObject);
        } catch (err) {
          console.error(`Failed to download ${r.filename}:`, err);
        }
      });

      await Promise.all(downloadPromises);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="p-8 max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Download Resources</h1>

        {/* Semesters */}
        <Select
          value={semID}
          onChange={(e) => setSemID(e.target.value)}
          loading={loadingSemesters}
          placeholder="Select semester"
          options={semesters.map((s) => ({
            key: s.semester_number,
            value: s.semester_number,
            label: s.title,
          }))}
        />

        {/* Subject */}
        <Select
          value={subjectId}
          onChange={(e) => {
            const id = e.target.value;
            setSubjectId(id);
            const subj = subjects.find((s) => String(s.id) === String(id));
            setsubjectName(subj?.name || "");
          }}
          loading={loadingSubjects}
          disabled={!semID}
          placeholder="Select subject"
          options={subjects.map((s) => ({
            key: s.id,
            value: s.id,
            label: s.name,
          }))}
        />

        {/* Unit */}
        <Select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          loading={loadingUnits}
          disabled={!subjectId}
          placeholder="Select unit"
          options={units.map((u) => ({
            key: u.id,
            value: u.id,
            label: `Unit ${u.unit_number} – ${u.title}`,
          }))}
        />

        {/* Resource type */}
        <Select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          disabled={!unitId}
          placeholder="All (slides, QA, etc.)"
          options={[
            { value: "slides", label: "Slides" },
            { value: "QA", label: "Question Answers" },
            { value: "QB", label: "Question Bank" },
            { value: "notes", label: "Notes" },
            { value: "assignment", label: "Assignment" },
            { value: "textbook", label: "Textbook" },
            { value: "PYQ", label: "Previous Year Questions" },
            { value: "misc", label: "Miscellaneous" },
          ]}
        />

        <button
          type="submit"
          onClick={handleDownloads}
          disabled={!semID || !subjectId || downloading}
          className="mt-2 w-full rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:cursor-pointer"
        >
          Download Files
        </button>

        {showNoResources && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="max-w-sm w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No resources found</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                There are no resources for the selected filters. Try another resource type or unit.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowNoResources(false)}
                  className="rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Download;
