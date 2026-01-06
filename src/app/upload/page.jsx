"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/components/ClientLayout";
import axiosClient from "@/lib/axios_client";

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

  // pre-submit staging state
  const [pendingResources, setPendingResources] = useState([]);
  const fileInputRef = useRef(null);

  // Set page title
  useEffect(() => {
    document.title = "Upload Resources | pes-bca";
  }, []);

  /* fetch semesters */
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
      try {
        const { data } = await axiosClient.get(`/api/units?subject_id=${subjectId}`);
        setUnits(data);
      } catch (error) {
        console.error("Error fetching units:", error);
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
      <h1 className="text-2xl font-bold">Upload Resource</h1>

      {/* Semesters */}
      <select
        value={semID}
        onChange={(e) => {
          setSemID(e.target.value);
        }}
        className="border p-2 w-full"
      >
        <option value="">Select semesters</option>
        {semesters &&
          semesters.map((s) => (
            <option key={s.id} value={s.semester_number}>
              {s.title}
            </option>
          ))}
      </select>

      {/* Subject */}
      <select
        value={subjectId}
        onChange={(e) => {
          const id = e.target.value;
          setSubjectId(id);
          const subj = subjects.find((s) => String(s.id) === String(id));
          setsubjectName(subj?.name || "");
        }}
        className="border p-2 w-full"
      >
        <option value="">Select subject</option>
        {subjects &&
          subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </select>

      {/* Unit */}
      <select
        value={unitId}
        onChange={(e) => setUnitId(e.target.value)}
        className="border p-2 w-full disabled:cursor-not-allowed hover:cursor-pointer"
        disabled={!subjectId}
      >
        <option value="">Select unit</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            Unit {u.unit_number} – {u.title}
          </option>
        ))}
      </select>

      {/* Resource type */}
      <select
        value={resourceType}
        onChange={(e) => setResourceType(e.target.value)}
        className="border p-2 w-full disabled:cursor-not-allowed hover:cursor-pointer"
        disabled={!unitId}
      >
        <option value="">Select resource type</option>
        <option value="slides">Slides</option>
        <option value="QA">Question Answers</option>
        <option value="QB">Question Bank</option>
        <option value="notes">Notes</option>
        <option value="assignment">Assignment</option>
        <option value="textbook">Textbook</option>
        <option value="PYQ">Previous Year Questions</option>
        <option value="misc">Miscellaneous</option>
      </select>

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
        <h2 className="text-lg font-semibold">Pending uploads</h2>

        {pendingResources.length === 0 ? (
          <p className="text-sm text-gray-500">No files added</p>
        ) : (
          <div className="space-y-2">
            {pendingResources.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center border rounded p-3"
              >
                {/* filename */}
                <div
                  className="truncate text-sm font-medium"
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
                  className="border rounded px-2 py-1 text-sm w-full"
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
        className="bg-blue-300 disabled:bg-gray-400 text-white px-4 py-2 rounded hover:cursor-pointer"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
