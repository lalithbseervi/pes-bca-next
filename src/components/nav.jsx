"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false); // Close the menu on desktop view
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const isActive = (href) => pathname === href;

  const getLinkClass = (href) => {
    let baseClass = "flex max-h-10 rounded-md justify-start items-center flex-1 ml-2 mr-4 hover:ring hover:shadow-[#21c063]/50 hover:text-[#21c063]";
    if (href == "/") baseClass += " mt-4"
    const activeClass = isActive(href)
      ? "border-2 border-[#21c063] bg-[#21c063] text-black hover:text-black"
      : "text-white";
    return `${baseClass} ${activeClass}`;
  };

  const navLinks = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/download", label: "Download PDFs", icon: "download" },
    { href: "/upload", label: "Upload PDFs", icon: "upload" },
    { href: "/status", label: "Status", icon: "status" },
    { href: "/feedback", label: "Feedback", icon: "feedback" },
    { href: "/terms-of-service", label: "Terms of Use", icon: "terms" },
    { href: "/privacy-policy", label: "Privacy Policy", icon: "privacy" },
  ];

  const renderIcon = (iconType) => {
    const iconProps = {
      className: "flex-row",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };

    switch (iconType) {
      case "home":
        return (
          <svg {...iconProps}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "download":
        return (
          <svg {...iconProps}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        );
      case "upload":
        return (
          <svg {...iconProps}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        );
      case "status":
        return (
          <svg {...iconProps}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      case "feedback":
        return (
          <svg {...iconProps}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        );
      case "terms":
        return (
          <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case "privacy":
        return (
          <svg {...iconProps}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      {mounted && (
        <button
          aria-label="Toggle menu"
          className="md:hidden hover:cursor-pointer fixed top-4 right-4 z-[60] p-2 text-white"
          onClick={toggleMenu}
        >
          {menuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      )}

      {/* Mobile/Tablet Overlay Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col p-8 pt-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex gap-4 items-center p-4 text-lg ${
                isActive(link.href)
                  ? "bg-[#21c063] text-black rounded-md"
                  : "text-white"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <div className="flex svg-container">
                {renderIcon(link.icon)}
              </div>
              <span>{link.label}</span>
            </Link>
          ))}

          <button
            id="privacy-settings-mobile"
            className="flex gap-4 items-center p-4 text-lg text-white"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex svg-container">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span>Privacy Settings</span>
          </button>
        </div>
      )}

      {/* Desktop Navigation */}
      {mounted && (
        <nav className="hidden md:flex px-2">
          <div className="flex flex-col group relative w-16 gap-4 hover:w-48 transition-all duration-300 border-r-2 border-gray-500 hover:border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getLinkClass(link.href)}
              >
                <div className="flex svg-container p-2">
                  {renderIcon(link.icon)}
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-500">
                  {link.label}
                </span>
              </Link>
            ))}

            {/* Privacy Settings Button */}
            <button
              id="privacy-settings-button"
              className="flex justify-start items-center text-white flex-1 ml-2 mr-4 rounded-md hover:ring hover:shadow-[#21c063]/50 hover:text-[#21c063]"
              style={{ cursor: "pointer", maxHeight: "4vh" }}
            >
              <div className="flex svg-container p-2">
                <svg
                  className="flex-row"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-500">Privacy Settings</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
