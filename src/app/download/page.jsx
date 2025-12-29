"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/components/clientLayout";

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

  /* fetch semesters */
  useEffect(() => {
    const abortController = new AbortController();

    const fetchSemesters = async () => {
      if (!session) return;
      try {
        const sems = await fetch(
          `/api/semesters?course_id=${session?.course_id}`,
          {
            signal: abortController.signal,
          }
        );
        const data = await sems.json();
        setSemesters(data);
      } catch (err) {
        console.warn(err);
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
        fetch(`/api/subjects?semester_id=${session?.current_sem_db}`)
          .then((res) => res.json())
          .then(setSubjects);
      }
    };
    fetchSubjects();
  }, []);

  /* fetch units by subjectId */
  useEffect(() => {
    if (!subjectId) {
      setUnits([]);
      setUnitId("");
      return;
    }

    fetch(`/api/units?subject_id=${subjectId}`)
      .then((res) => res.json())
      .then(setUnits);
  }, [subjectId]);

  // Fetch resources when active unit changes
  const handleDownloads = async () => {
    if (!unitId) return;

    setDownloading(true);
    try {
      const url = `/api/resources?subject_id=${subjectId}&unit_id=${unitId}${
        resourceType ? `&resource_type=${resourceType}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();

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
          const res = await fetch(downloadUrl);
          const blob = await res.blob();
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
        <h1 className="text-2xl font-bold">Download Resources</h1>

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
              <option key={s.semester_number} value={s.semester_number}>
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
          className="border p-2 w-full disabled:cursor-not-allowed"
          disabled={!semID}
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
          <option value="">All (slides, QA, etc.)</option>
          <option value="slides">Slides</option>
          <option value="QA">Question Answers</option>
          <option value="QB">Question Bank</option>
          <option value="notes">Notes</option>
          <option value="assignment">Assignment</option>
          <option value="textbook">Textbook</option>
          <option value="PYQ">Previous Year Questions</option>
          <option value="misc">Miscellaneous</option>
        </select>

        <button
          type="submit"
          onClick={handleDownloads}
          disabled={!semID || !subjectId || downloading}
          className="disabled:cursor-not-allowed hover:cursor-pointer"
        >
          Download Files
        </button>
      </div>
    </>
  );
};

export default Download;
