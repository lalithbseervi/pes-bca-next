"use client";
import { useState, useEffect } from "react";
import axiosClient from "@/lib/axios_client";

export default function AdminPanel() {
  // Courses
  const [courses, setCourses] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Semesters
  const [semesters, setSemesters] = useState([]);
  const [semesterNumber, setSemesterNumber] = useState("");
  const [semesterTitle, setSemesterTitle] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setsubjectName] = useState("");
  const [subjectShortcode, setSubjectShortcode] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Units
  const [units, setUnits] = useState([]);
  const [unitNumber, setUnitNumber] = useState("");
  const [unitTitle, setUnitTitle] = useState("");

  // Set page title
  useEffect(() => {
    document.title = "Admin Panel | pes-bca";
  }, []);

  // --- Fetch Functions ---
  const fetchCourses = async () => {
    try {
      const { data } = await axiosClient.get("/api/courses");
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchSemesters = async (course_id) => {
    if (!course_id) return;
    try {
      const { data } = await axiosClient.get(`/api/semesters?course_id=${course_id}`);
      setSemesters(data);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchSubjects = async (semester_id) => {
    if (!semester_id) return;
    try {
      const { data } = await axiosClient.get(`/api/subjects?semester_id=${semester_id}`);
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchUnits = async (subject_id) => {
    if (!subject_id) return;
    try {
      const { data } = await axiosClient.get(`/api/units?subject_id=${subject_id}`);
      setUnits(data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  // --- CRUD Functions ---
  const createCourse = async () => {
    try {
      await axiosClient.post("/api/courses", {
        course_code: courseCode,
        course_name: courseName
      });
      setCourseCode(""); setCourseName(""); fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  const deleteCourse = async (id) => {
    try {
      await axiosClient.delete("/api/courses", { data: { id } });
      setSelectedCourse(null); setSemesters([]); setSelectedSemester(null); setSubjects([]); setSelectedSubject(null); setUnits([]);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const createSemester = async () => {
    if (!selectedCourse) return;
    try {
      await axiosClient.post("/api/semesters", {
        course_id: selectedCourse.id,
        semester_number: semesterNumber,
        title: semesterTitle
      });
      setSemesterNumber(""); setSemesterTitle(""); fetchSemesters(selectedCourse.id);
    } catch (error) {
      console.error("Error creating semester:", error);
    }
  };

  const deleteSemester = async (id) => {
    try {
      await axiosClient.delete("/api/semesters", { data: { id } });
      setSelectedSemester(null); setSubjects([]); setSelectedSubject(null); setUnits([]);
      fetchSemesters(selectedCourse.id);
    } catch (error) {
      console.error("Error deleting semester:", error);
    }
  };

  const createSubject = async () => {
    if (!selectedSemester) return;
    try {
      await axiosClient.post("/api/subjects", {
        semester_id: selectedSemester.id,
        name: subjectName,
        shortcode: subjectShortcode
      });
      setsubjectName(""); setSubjectShortcode(""); fetchSubjects(selectedSemester.id);
    } catch (error) {
      console.error("Error creating subject:", error);
    }
  };

  const deleteSubject = async (id) => {
    try {
      await axiosClient.delete("/api/subjects", { data: { id } });
      setSelectedSubject(null); setUnits([]);
      fetchSubjects(selectedSemester.id);
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const createUnit = async () => {
    if (!selectedSubject) return;
    try {
      await axiosClient.post("/api/units", {
        subject_id: selectedSubject.id,
        unit_number: unitNumber,
        title: unitTitle
      });
      setUnitNumber(""); setUnitTitle(""); fetchUnits(selectedSubject.id);
    } catch (error) {
      console.error("Error creating unit:", error);
    }
  };

  const deleteUnit = async (id) => {
    try {
      await axiosClient.delete("/api/units", { data: { id } });
      fetchUnits(selectedSubject.id);
    } catch (error) {
      console.error("Error deleting unit:", error);
    }
  };

  // --- Render ---
  return (
    <div className="p-8 space-y-8">
      {/* Courses */}
      <div>
        <h2 className="text-xl font-bold mb-2">Courses</h2>
        <input placeholder="Code" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
        <input placeholder="Name" value={courseName} onChange={e => setCourseName(e.target.value)} />
        <button onClick={createCourse} className="ml-2 bg-blue-500 text-white px-2">Create</button>

        <ul className="mt-2 space-y-1">
          {courses.map(c => (
            <li key={c.id}>
              <span onClick={() => { setSelectedCourse(c); fetchSemesters(c.id); setSelectedSemester(null); setSubjects([]); setSelectedSubject(null); setUnits([]); }} className={`cursor-pointer ${selectedCourse?.id === c.id ? "font-bold" : ""}`}>{c.course_code} - {c.course_name}</span>
              <button onClick={() => deleteCourse(c.id)} className="ml-2 text-red-600">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Semesters */}
      {selectedCourse && (
        <div>
          <h2 className="text-xl font-bold mb-2">Semesters for {selectedCourse.course_name}</h2>
          <input placeholder="Number" value={semesterNumber} onChange={e => setSemesterNumber(e.target.value)} />
          <input placeholder="Title" value={semesterTitle} onChange={e => setSemesterTitle(e.target.value)} />
          <button onClick={createSemester} className="ml-2 bg-blue-500 text-white px-2">Create</button>

          <ul className="mt-2 space-y-1">
            {semesters.map(s => (
              <li key={s.id}>
                <span onClick={() => { setSelectedSemester(s); fetchSubjects(s.id); setSelectedSubject(null); setUnits([]); }} className={`cursor-pointer ${selectedSemester?.id === s.id ? "font-bold" : ""}`}>Sem {s.semester_number} - {s.title}</span>
                <button onClick={() => deleteSemester(s.id)} className="ml-2 text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subjects */}
      {selectedSemester && (
        <div>
          <h2 className="text-xl font-bold mb-2">Subjects for Sem {selectedSemester.semester_number}</h2>
          <input placeholder="Name" value={subjectName} onChange={e => setsubjectName(e.target.value)} />
          <input placeholder="Shortcode" value={subjectShortcode} onChange={e => setSubjectShortcode(e.target.value)} />
          <button onClick={createSubject} className="ml-2 bg-blue-500 text-white px-2">Create</button>

          <ul className="mt-2 space-y-1">
            {subjects.map(sub => (
              <li key={sub.id}>
                <span onClick={() => { setSelectedSubject(sub); fetchUnits(sub.id); }} className={`cursor-pointer ${selectedSubject?.id === sub.id ? "font-bold" : ""}`}>{sub.name} ({sub.shortcode})</span>
                <button onClick={() => deleteSubject(sub.id)} className="ml-2 text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Units */}
      {selectedSubject && (
        <div>
          <h2 className="text-xl font-bold mb-2">Units for {selectedSubject.name}</h2>
          <input placeholder="Number" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} />
          <input placeholder="Title" value={unitTitle} onChange={e => setUnitTitle(e.target.value)} />
          <button onClick={createUnit} className="ml-2 bg-blue-500 text-white px-2">Create</button>

          <ul className="mt-2 space-y-1">
            {units.map(u => (
              <li key={u.id}>
                Unit {u.unit_number} - {u.title}
                <button onClick={() => deleteUnit(u.id)} className="ml-2 text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
