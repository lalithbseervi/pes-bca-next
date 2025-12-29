"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResourceTable({ subjectId, resourceType }) {
  const [units, setUnits] = useState([]);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Fetch units for subject
  useEffect(() => {
    if (!subjectId) return;

    const fetchUnits = async () => {
      setLoadingUnits(true);
      const res = await fetch(`/api/units?subject_id=${subjectId}`);
      const data = await res.json();

      setUnits(data);

      // default to unit 1
      if (data.length > 0) {
        setActiveUnitId(data[0].id);
      }
    };

    fetchUnits().finally(() => setTimeout(() => {setLoadingUnits(false)}, 300));
  }, [subjectId]);

  // Fetch resources when active unit changes
  useEffect(() => {
    if (!activeUnitId) return;

    const fetchResources = async () => {
      setLoadingResources(true);
      const url = `/api/resources?subject_id=${subjectId}&unit_id=${activeUnitId}${resourceType ? `&resource_type=${resourceType}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      let processed = data;
      if (!resourceType) {
        const extractSlideNumber = (textOrKey) => {
          const s = textOrKey || "";
          const last = s.split("/").pop() || s;
          const name = last.replace(/\.[^/.]+$/, "");
          const m = name.match(/^(?:0+)?(\d{1,3})(?:\D|$)/) || name.match(/(\d{1,3})/);
          return m ? parseInt(m[1], 10) : null;
        };

        processed = data.map((r) => (
          r.resource_type === "slides"
            ? { ...r, _slide_num: extractSlideNumber(r.storage_key) }
            : { ...r, _slide_num: null }
        ));

        processed.sort((a, b) => {
          const aIsSlide = a.resource_type === "slides";
          const bIsSlide = b.resource_type === "slides";
          if (aIsSlide && bIsSlide) {
            const aNum = a._slide_num !== null && a._slide_num !== undefined ? a._slide_num : Number.POSITIVE_INFINITY;
            const bNum = b._slide_num !== null && b._slide_num !== undefined ? b._slide_num : Number.POSITIVE_INFINITY;
            if (aNum !== bNum) return aNum - bNum;
            return (a.link_text || "").localeCompare(b.link_text || "");
          }
          if (aIsSlide && !bIsSlide) return -1;
          if (!aIsSlide && bIsSlide) return 1;
          return (a.link_text || "").localeCompare(b.link_text || "");
        });
      }

      setResources(processed);
    };

    fetchResources().finally(() => setTimeout(() => {setLoadingResources(false)}, 300));
  }, [activeUnitId, resourceType, subjectId]);

  const mapping = {
    "slides": "Slides",
    "QA": "Question Answers",
    "QB": "Question Bank",
    "notes": "Notes",
    "assignment": "Assignment",
    "textbook": "Textbook",
    "PYQ": "Previous Year Questions",
    "miscellaneous": "Miscellaneous"
  };

  return (
    <div className="mt-6">
      {/* Unit Tabs */}
      <div className="flex border-b mb-4 overflow-x-auto">
        {loadingUnits && (
          <div className="flex gap-4 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-20 md:w-28 rounded-xl bg-gray-300 animate-pulse transform hover:scale-102 transition-all duration-500"
                aria-label="Loading units"
              />
            ))}
          </div>
        )}
        {!loadingUnits &&
          units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setActiveUnitId(unit.id)}
              className={`px-2 md:px-4 py-2 border-b-2 hover:cursor-pointer whitespace-nowrap text-sm md:text-base ${
                activeUnitId === unit.id
                  ? "border-blue-500 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {unit.title}
            </button>
          ))}
      </div>

      {/* Resource Table */}
      <div className="overflow-x-auto max-w-full lg:max-w-10/12">
        {loadingResources ? (
          <div className="space-y-3" aria-label="Loading resources">
              <div
                className="h-[25vh] sm:h-[22vh] md:h-[20vh] lg:h-[32vh] w-full lg:max-w-11/12 xl:max-w-10/12 bg-gray-200 animate-pulse rounded-md duration-500"
              />
          </div>
        ) : (
          <table className="w-full lg:max-w-11/12 xl:max-w-10/12 border text-xs md:text-sm mb-4">
            <thead className="bg-gray-100 text-black">
              <tr>
                <th className="border py-1 px-2 md:p-2 text-left w-[15%]">Type</th>
                <th className="border py-1 px-2 md:p-2 text-left w-[60%]">Topic</th>
                <th className="border py-1 px-2 md:p-2 min-w-28 lg:max-w-[8vw] whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody>
              {resources.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-2 px-4 md:p-4 text-center text-gray-500">
                    No resources for this unit
                  </td>
                </tr>
              )}

              {resources.map((res) => (
                <tr key={res.id}>
                  <td className="border py-1 px-2 text-left md:p-2 w-[15%]">{mapping[res.resource_type]}</td>
                  <td className="border py-1 px-2 md:p-2 w-[60%] truncate">
                    {res.link_text}
                  </td>
                  <td className="border px-2 md:p-2 text-center whitespace-nowrap overflow-x-auto min-w-28 lg:max-w-[8vw]">
                    <Link
                      href={`/view/?file=${res.storage_key}`}
                      className="text-blue-500 underline"
                    >
                      View
                    </Link> |&nbsp;
                    <Link
                      href={`/api/download/?file=${res.storage_key}`}
                      className="text-blue-500 underline"
                    >
                      Download
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
