"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axiosClient from "@/lib/axios_client";
import { generateETag } from "@/lib/etag";

export default function ResourceTable({ semesterId, subjectId, resourceType }) {
  const [units, setUnits] = useState([]);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Fetch units for subject
  useEffect(() => {
    if (!subjectId) return;

    // Clear resources and units when subject changes
    setResources([]);
    setActiveUnitId(null);

    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const { data } = await axiosClient.get(
          `/api/units?subject_id=${subjectId}`
        );
        setUnits(data);
        // default to unit 1
        if (data.length > 0) {
          setActiveUnitId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
      } finally {
        setTimeout(() => {
          setLoadingUnits(false);
        }, 300);
      }
    };

    fetchUnits();
  }, [subjectId]);

  // Fetch resources when active unit changes
  // TODO: Use only one localStorage item per unit and let it store the result of fetching all resources for a unit.
  // When a resource_type filter is applied on this unit, let the result be immediately rendered,
  // by fetching the data from the localStorage item.
  // Run a background fetch call for that particular resource_type and unit.
  // if the response is 200 instead of 304, then upsert all the new response data into the localStorage item for that unit.
  // but the rest of the data in localStorage shouldn'd be affected.

  /*
   * example localStorage item having the name res_9 and its corresponding value
   * res_9:"[{"unit_id":9,"resource_type":"QA","filename":"QA_WD_Unit_1_UQ25CA152A.pdf","storage_key":"CA/sem-1/Web Design/unit-2/QA/QA_WD_Unit_1_UQ25CA152A.pdf","link_text":"WD Unit-2 QA"}]"
   */

  useEffect(() => {
    if (!activeUnitId) return;

    const fetchResources = async () => {
      const resourceCacheKey = `res_${activeUnitId}`;

      // Safely access localStorage (may not exist in SSR or be blocked)
      let cachedResources = null;
      let cachedETag = null;
      let cachedFilterETag = null;

      if (typeof window !== "undefined" && window.localStorage) {
        try {
          cachedResources = localStorage.getItem(resourceCacheKey);
          cachedETag = localStorage.getItem(`etag_${activeUnitId}`);
        } catch (e) {
          console.warn("localStorage access failed:", e);
        }
      }

      // Generate filter-specific ETag key
      const filterETagKey = resourceType
        ? `etag_${activeUnitId}_${resourceType}`
        : null;
      if (
        filterETagKey &&
        typeof window !== "undefined" &&
        window.localStorage
      ) {
        try {
          cachedFilterETag = localStorage.getItem(filterETagKey);
        } catch (e) {
          console.warn("localStorage access failed:", e);
        }
      }

      const url = `/api/resources?subject_id=${subjectId}&unit_id=${activeUnitId}${
        resourceType ? `&resource_type=${resourceType}` : ""
      }`;

      // If cache exists and resourceType filter is applied, show filtered data immediately
      if (cachedResources && resourceType) {
        console.log("Using cached data with filter");
        let resources = JSON.parse(cachedResources);
        resources = resources.filter((r) => r.resource_type === resourceType);

        // Generate ETag for filtered results
        const filteredETag = generateETag(JSON.stringify(resources));

        setResources(resources);
        setLoadingResources(false);

        // Background fetch for this specific resource type with filter-specific ETag
        axiosClient
          .get(url, {
            headers: {
              "If-None-Match": cachedFilterETag || filteredETag,
            },
            validateStatus: (status) =>
              (status >= 200 && status < 300) || status === 304,
          })
          .then((res) => {
            if (res.status === 304) {
              console.log("No changes in resources for filter:", resourceType);
              return;
            }

            if (res.status === 200) {
              const newData = res.data;
              const newETag = res.headers["etag"] || res.headers["x-res-tag"];

              // Parse cached data for this resource type
              let cachedAll = JSON.parse(cachedResources);

              // Remove old resources of this type
              cachedAll = cachedAll.filter(
                (r) => r.resource_type !== resourceType
              );

              // Add new resources of this type to the existing data
              cachedAll = [...cachedAll, ...newData];

              // Update localStorage with merged data
              try {
                localStorage.setItem(
                  resourceCacheKey,
                  JSON.stringify(cachedAll)
                );
                localStorage.setItem(filterETagKey, newETag);
              } catch (e) {
                console.warn("localStorage write failed:", e);
              }

              // Update displayed resources with new filtered data
              setResources(newData);
            }
          })
          .catch((err) => {
            console.error("Error fetching resources:", err);
          });

        return;
      }

      // If no cache, fetch all resources for the unit
      setLoadingResources(true);

      try {
        const res = await axiosClient.get(url, {
          headers: {
            "If-None-Match": cachedETag || "",
          },
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 304,
        });

        if (res.status === 304) {
          console.log("No changes in resources.");
          let resources = JSON.parse(cachedResources);
          if (resourceType) {
            resources = resources.filter(
              (r) => r.resource_type === resourceType
            );
          }
          setResources(resources);
          setLoadingResources(false);
          return;
        }

        if (res.status === 200) {
          const data = res.data;
          const newETag = res.headers["etag"] || res.headers["x-res-tag"];
          try {
            localStorage.setItem(resourceCacheKey, JSON.stringify(data));
            localStorage.setItem(`etag_${activeUnitId}`, newETag);

            // If filtering, generate and store filter-specific ETag
            if (resourceType && filterETagKey) {
              const displayResources = data.filter(
                (r) => r.resource_type === resourceType
              );
              const filteredETag = generateETag(
                JSON.stringify(displayResources)
              );
              localStorage.setItem(filterETagKey, filteredETag);
            }
          } catch (e) {
            console.warn("localStorage write failed:", e);
          }

          // If filtering, generate and store filter-specific ETag
          let displayResources = data;
          if (resourceType) {
            displayResources = data.filter(
              (r) => r.resource_type === resourceType
            );
            const filteredETag = generateETag(JSON.stringify(displayResources));
            localStorage.setItem(filterETagKey, filteredETag);
          }

          setResources(displayResources);
          setLoadingResources(false);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [activeUnitId, resourceType, subjectId]);

  const mapping = {
    slides: "Slides",
    QA: "Question Answers",
    QB: "Question Bank",
    notes: "Notes",
    assignment: "Assignment",
    textbook: "Textbook",
    PYQ: "Previous Year Questions",
    miscellaneous: "Miscellaneous",
  };

  return (
    <div className="mt-14">
      {/* Unit Tabs */}
      <div className="flex border-b mb-4 overflow-x-auto">
        {loadingUnits && (
          <div className="flex gap-4 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-20 md:w-28 rounded-xl bg-gray-300 dark:bg-gray-600 animate-pulse transform hover:scale-102 transition-all duration-300"
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
                  ? "border-blue-500 font-semibold text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 dark:text-gray-400"
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
            <div className="h-[25vh] sm:h-[22vh] md:h-[20vh] lg:h-[32vh] w-full lg:max-w-11/12 xl:max-w-10/12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md duration-300" />
          </div>
        ) : (
          <table className="w-full lg:max-w-11/12 xl:max-w-10/12 border text-xs md:text-sm mb-4">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <tr>
                <th className="border py-1 px-2 md:p-2 text-left w-[15%]">
                  Type
                </th>
                <th className="border py-1 px-2 md:p-2 text-left w-[60%]">
                  Topic
                </th>
                <th className="border py-1 px-2 md:p-2 min-w-28 lg:max-w-[8vw] whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {!semesterId ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-2 px-4 md:p-4 text-xl text-center text-gray-500 dark:text-neutral-400"
                  >
                    Select Semester
                  </td>
                </tr>
              ) : !subjectId ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-2 px-4 md:p-4 text-xl text-center text-gray-500 dark:text-neutral-400"
                  >
                    Select Subject
                  </td>
                </tr>
              ) : (
                <></>
              )}
              {resources.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="py-2 px-4 md:p-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No resources available.
                  </td>
                </tr>
              )}

              {resources.map((res, idx) => (
                <tr key={idx}>
                  <td className="border py-1 px-2 text-left md:p-2 w-[15%]">
                    {mapping[res.resource_type]}
                  </td>
                  <td className="border py-1 px-2 md:p-2 w-[60%] truncate">
                    {res.link_text}
                  </td>
                  <td className="border px-2 md:p-2 text-center whitespace-nowrap overflow-x-auto min-w-28 lg:max-w-[8vw]">
                    <Link
                      href={`/view/?file=${res.storage_key}`}
                      prefetch={false}
                      className="text-blue-500 underline"
                    >
                      View
                    </Link>{" "}
                    |&nbsp;
                    <Link
                      href={`/api/download/?file=${res.storage_key}`}
                      prefetch={false}
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
