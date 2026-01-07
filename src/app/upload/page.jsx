"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/components/ClientLayout";
import axiosClient from "@/lib/axios_client";
import Select from "@/components/Select";

export default function ResourceUploadPage() {
  const { session } = useSession();
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);

  const [semID, setSemID] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setsubjectName] = useState("");
  const [unitId, setUnitId] = useState("");

  const [resourceType, setResourceType] = useState("");
  const [uploading, setUploading] = useState(false);

  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // pre-submit staging state
  const [pendingResources, setPendingResources] = useState([]);
  const fileInputRef = useRef(null);

  // Set page title
  useEffect(() => {
    document.title = "Upload Resources | lms";
  }, []);

  /* fetch semesters */
  useEffect(() => {
    const abortController = new AbortController();

    const fetchSemesters = async () => {
      if (!session?.course_id) return;

      setLoadingSemesters(true);
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
      } finally {
        setLoadingSemesters(false);
      }
    };

    fetchSemesters();

    return () => abortController.abort();
  }, [session]);

  /* fetch subjects */
  useEffect(() => {
    if (!semID) {
      setSubjects([]);
      setSubjectId("");
      setUnits([]);
      setUnitId("");
      return;
    }

    const abortController = new AbortController();

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const selectedSemester = semesters.find(
          (s) => String(s.semester_number) === String(semID)
        );
        if (!selectedSemester) return;

        const { data } = await axiosClient.get(
          `/api/subjects?semester_id=${selectedSemester.id}`,
          {
            signal: abortController.signal,
          }
        );
        setSubjects(data);
        setSubjectId("");
        setUnits([]);
        setUnitId("");
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching subjects:", error);
        }
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
    return () => abortController.abort();
  }, [semID, semesters]);

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
        console.error("Error fetching units:", error);
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, [subjectId]);

  /* add file to queue  */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const generateLinkText = (filename) => {
      return filename
        .replace(/^\d{1,2}_/, "") // Remove 1-2 digit prefix with underscore
        .replace(/_[^_]*$/, "") // Remove from last underscore to end
        .replace(/_/g, " "); // Replace remaining underscores with spaces
    };

    setPendingResources((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        linkText: generateLinkText(file.name),
        resourceType,
      })),
    ]);

    e.target.value = "";

    requestAnimationFrame(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  /* upload all  */
  const handleUpload = async () => {
    if (!unitId || pendingResources.length === 0) {
      alert("Select unit and add files");
      return;
    }

    setUploading(true);

    try {
      // Stabilize selected unit and derive folder unit number (match label "Unit X")
      const currentUnitId = unitId;
      const selectedUnit = units.find(
        (u) => String(u.id) === String(currentUnitId)
      );
      const folderUnitNumber = selectedUnit?.unit_number ?? currentUnitId; // fallback to id
      const courseCode = JSON.parse(
        localStorage.getItem("user_session")
      ).course_code;

      for (const r of pendingResources) {
        const storageKey = `${courseCode}/sem-${semID}/${subjectName}/unit-${folderUnitNumber}/${r.resourceType}/${r.file.name}`;

        // Prepare FormData for file upload
        const formData = new FormData();
        formData.append("file", r.file);
        formData.append("storageKey", storageKey);
        formData.append("unitId", currentUnitId);
        formData.append("resourceType", r.resourceType);
        formData.append("filename", r.filename);
        formData.append("linkText", r.linkText);

        // Upload via API route (backend handles Supabase interaction)
        const response = await axiosClient.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Upload failed");
        }
      }

      setPendingResources([]);
      alert("Upload successful");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Resource</h1>

      {/* Semesters */}
      <Select
        value={semID}
        onChange={(e) => setSemID(e.target.value)}
        loading={loadingSemesters}
        placeholder="Select semester"
        options={semesters.map((s) => ({
          key: s.id,
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
        placeholder="Select resource type"
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

      {/* File input */}
      <input
        type="file"
        onChange={handleFileSelect}
        className="border p-2 w-full disabled:cursor-not-allowed hover:cursor-pointer"
        disabled={!resourceType || uploading}
        ref={fileInputRef}
        multiple
      />

      {/* Pending container */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending uploads</h2>

        {pendingResources.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No files added</p>
        ) : (
          <div className="space-y-2">
            {pendingResources.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center border border-gray-300 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800"
              >
                {/* filename */}
                <div
                  className="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
                  title={r.filename}
                >
                  {r.filename}
                </div>

                {/* link text */}
                <input
                  type="text"
                  value={r.linkText}
                  onChange={(e) =>
                    setPendingResources((prev) =>
                      prev.map((p) =>
                        p.id === r.id ? { ...p, linkText: e.target.value } : p
                      )
                    )
                  }
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Link text"
                />

                {/* remove */}
                <button
                  onClick={() =>
                    setPendingResources((prev) =>
                      prev.filter((p) => p.id !== r.id)
                    )
                  }
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || pendingResources.length === 0}
        className="bg-blue-600 dark:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
