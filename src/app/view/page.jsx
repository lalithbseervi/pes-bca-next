"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/lib/axios_client";

export default function ViewResourcePage() {
  const searchParams = useSearchParams();
  const storageKey = searchParams.get("file");

  const [resourceData, setResourceData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [navigation, setNavigation] = useState({ prev: null, next: null });

  const [width, setWidth] = useState(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    window.addEventListener("resize", handleWindowSizeChange);
    return () => {
      window.removeEventListener("resize", handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 768;

  // Set page title dynamically based on resource
  useEffect(() => {
    if (resourceData) {
      document.title = `${resourceData.link_text} | LMS`;
    } else {
      document.title = "View Resource | LMS";
    }
  }, [resourceData]);

  const resourceMapping = {
    slides: "Slides",
    QA: "Question Answers",
    QB: "Question Bank",
    notes: "Notes",
    assignment: "Assignment",
    misc: "Miscellaneous",
    PYQ: "Previous Year Questions",
    textbook: "Textbook",
  };

  useEffect(() => {
    if (!storageKey) return;

    const fetchResource = async () => {
      // Fetch resource details
      const { data: resourceData } = await axiosClient.get(`/api/resources?file=${storageKey}&include_id=true`);

      if (resourceData && resourceData.length > 0) {
        const resource = resourceData[0];
        setResourceData(resource);

        // Use same-origin API to stream PDF (works for private buckets and avoids CORS)
        setPdfUrl(`/api/download?view_file=${storageKey}`);

        // Fetch navigation efficiently using resource ID
        const { data: navData } = await axiosClient.get(
          `/api/resources/navigation?id=${resource.id}`
        );
        setNavigation(navData);
      }
    };

    fetchResource();
  }, [storageKey]);

  // No PDF.js worker required when using the browser viewer

  if (!storageKey) {
    return <div className="p-8">No file specified</div>;
  }

  if (!resourceData || !pdfUrl) {
    return <div className="p-8">Loading...</div>;
  }

  // Extract subject name and unit number from resource data
  const unit_details = storageKey.split("/")[3];
  const unit_num = unit_details.charAt(unit_details.length - 1);

  const breadcrumb_next_svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="size-4 md:size-4"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );

  const prev_nav_svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18"
      />
    </svg>
  );

  const next_nav_svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
      />
    </svg>
  );

  const mobile_next_nav_svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-4 ml-2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );

  const mobile_prev_nav_svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );

  return (
    <div
      className="flex flex-col h-screen w-full md:max-w-[85vw] lg:max-w-[75vw] ml-auto mr-auto"
      id="viewPageContainer"
    >
      {/* Header/Breadcrumb */}
      <div className="border md:border-2 rounded-lg md:m-4 p-2 md:p-4">
        <div className="text-base md:text-lg font-mono flex items-center gap-2">
          <span>{resourceData.subject_name || "Subject"}</span>
          {breadcrumb_next_svg}
          <span>
            {resourceData.unit_number
              ? `Unit-${unit_num}`
              : "Applicable to all Units"}
          </span>
          {breadcrumb_next_svg}
          <span>{resourceMapping[resourceData.resource_type]}</span>
        </div>
        <div className="mt-1 md:mt-2">{resourceData.link_text}</div>
      </div>

      {/* PDF Viewer (native browser toolbar) */}
      <div className="flex-1 mt-2 md:mt-0 mx-4 mb-4 bg-gray-50 dark:bg-gray-900">
        <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
      </div>

      {/* Navigation Buttons */}
      <div className="flex md:justify-between md:mx-4 md:mb-4 gap-2">
        <div className="border md:border-2 rounded-lg p-2 md:p-4 md:w-max">
          {navigation.prev ? (
            <Link
              prefetch={false}
              href={`/view/?file=${navigation.prev.storage_key}`}
              className="flex items-center md:gap-2 hover:text-blue-300"
            >
              {isMobile ? mobile_prev_nav_svg : prev_nav_svg}
              <span className={isMobile ? "ml-2" : "ml-0"}>{navigation.prev.link_text}</span>
            </Link>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 flex items-center md:gap-2">
              {isMobile ? mobile_prev_nav_svg : prev_nav_svg}
              <span className={isMobile ? "ml-2" : "ml-0"}>No previous resource</span>
            </span>
          )}
        </div>

        <div className="border md:border-2 rounded-lg p-2 md:p-4 md:w-max">
          {navigation.next ? (
            <Link
              prefetch={false}
              href={`/view/?file=${navigation.next.storage_key}`}
              className="flex items-center justify-end md:gap-2 hover:text-blue-300"
            >
              <span>{navigation.next.link_text}</span>
              {isMobile ? mobile_next_nav_svg : next_nav_svg}
            </Link>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 flex items-center justify-end md:gap-2">
              <span>No next resource</span>
              {isMobile ? mobile_next_nav_svg : next_nav_svg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
