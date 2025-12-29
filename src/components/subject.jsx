"use client";
import { useEffect, useState } from "react";
import RenderTopics from "./topics";

const RenderSubjectDetails = ({ sem, subjects }) => {
  const [semChoice, setSemChoice] = useState('sem-1');
  const [subjectChoice, setSubjectChoice] = useState(null);

  const currentSubjects = subjects?.[0]?.[semChoice] || {};
  useEffect(() => {
    // Pick the first subject as default when semester changes.
    const firstSubjectKey = Object.keys(currentSubjects)[0] || null;
    setSubjectChoice(firstSubjectKey);
  }, [semChoice, currentSubjects]);

  const handleSelectSem = (e) => {
    const selectedSem = e.target.value;
    setSemChoice(selectedSem);
  };

  const handleSelectSubject = (e) => {
    const selectedSubject = e.target.value;
    setSubjectChoice(selectedSubject);
  };

  return (
    <div className="RenderSubjectDetails">
      <form action="">
        <fieldset>
          <select 
          name="semester" 
          id="sem" 
          value={semChoice}
          onChange={handleSelectSem}
          >
            {Object.entries(sem).map(([key, val]) => (
              <option value={key} key={key}>
                {val}
              </option>
            ))}
          </select>
          <select
            name="subject"
            id="subject"
            value={subjectChoice || ""}
            onChange={handleSelectSubject}
            disabled={Object.keys(currentSubjects).length === 0}
          >
            {Object.entries(currentSubjects).map(([key, val]) => (
              <option value={key} key={key}>
                {val}
              </option>
            ))}
          </select>
        </fieldset>
      </form>

      <RenderTopics sem={semChoice} subject={subjectChoice} />
    </div>
  );
};

export default RenderSubjectDetails;
