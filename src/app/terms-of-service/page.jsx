'use client';
import { useEffect, useState } from "react";
import Link from "next/link";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-semibold mt-6 mb-4">{title}</h2>
    <div className="text-md text-neutral-300">{children}</div>
  </div>
);

const TermsOfService = () => {
  // State to ensure client-side rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    document.title = "Terms of Service | lms";
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-semibold text-center mb-6">
        Terms of Service
      </h1>
      <p className="text-base text-center mb-8">Last Updated: 29-11-2025</p>

      <p className="font-semibold text-md mb-6">
        <i>
          Note: By using this platform, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service.
        </i>
      </p>
      <p className="text-md">
        Welcome to the unofficial read-only dashboard "lms" ("we", "our",
        "us"). By accessing or using this site, you agree to the following Terms
        of Service ("Terms"). If you do not agree to these Terms, you must not
        access or use the platform.
      </p>

      {/* User Responsibilities */}
      <Section title={"User Responsibilities"}>
        <p> You agree to: </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>
              Respect the ownership of the content distributed, i.e,
              acknowledging that the slides, question banks, and any other
              university material's sole owner is PES University.
            </li>
            <li>
              Not re-distribute the university content to those who would
              otherwise not have access to the same.
            </li>
            <li>
              Use the platform solely for educational purposes in accordance
              with your enrollment in the course(s).
            </li>
            <li>
              Not attempt to attack/harm the site in any way, including but not
              limited to XSS, DDoS and more.
            </li>
            <li>
              Maintain the confidentiality of any login credentials you use to
              access the platform.
            </li>
            <li>
              Abide by all terms mentioned here and understand the{" "}
              <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline transition-colors">privacy policy</Link>.
            </li>
          </ul>
      </Section>

      {/* Prohibited Activities */}
      <Section title={"Prohibited Activities"}>
        <p>You are prohibited from:</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>
              Attempting to gain unauthorised access or help others get
              unauthorised access to any content hosted on this site or PESU
              Academy (pesuacademy.com)
            </li>
            <li>
              Engaging in any form of hacking, data mining, or
              reverse-engineering of the platform.
            </li>
            <li>
              Interfering with or disrupting the functionality of the platform,
              including its servers or networks.
            </li>
            <li>
              Violating any copyright, trademark, or intellectual property
              rights of the course content, the institution offering the course
              (PES), or other users.
            </li>
          </ul>
      </Section>

      {/* Intellectual Property */}
      <Section title={"Intellectual Property"}>
        <p>
          All course materials, content, graphics, designs, logos, and other
          intellectual property made available through PESU Academy are the
          property of the institution or third parties who have licensed them.
          Your access to the platform grants you a limited, non-exclusive,
          non-transferable license to view and use the content for personal,
          non-commercial educational purposes only. You may not reproduce,
          distribute, or otherwise exploit the materials without the express
          consent of the intellectual property owner.
        </p>
      </Section>

      {/* Privacy and Data Collection */}
      <Section title={"Privacy and Data Collection"}>
        <p>
          We are committed to protecting your privacy. Our collection and use of
          your personal data are governed by our{" "}
          <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline transition-colors">Privacy Policy</Link>. By using the platform,
          you consent to the collection and processing of your personal data as
          outlined in the Privacy Policy.
        </p>
      </Section>

      {/* No Warranty and Limitation of Liability */}
      <Section title={"No Warranty and Limitation of Liability"}>
        <p>
          The platform is provided "as is" and "as available." We do not
          guarantee that the platform will be uninterrupted, error-free, or free
          from harmful components, and we disclaim any warranties, express or
          implied, including but not limited to the implied warranties of
          merchantability and fitness for a particular purpose. To the fullest
          extent permitted by law, we are not liable for any damages arising
          from:
        </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Your use or inability to use the platform.</li>
            <li>Any content or materials provided through the platform.</li>
            <li>
              Any disruptions or errors related to your access to the platform.
            </li>
          </ul>
          You may check the status of the site in case of any errors at{" "}
          <Link href="/status" className="text-blue-400 hover:text-blue-300 underline transition-colors">/status</Link>.
      </Section>

      {/* Changes to Terms of Service */}
      <Section title={"Changes to Terms of Service"}>
        <p>
          We reserve the right to modify or update these Terms at any time. If
          changes are made, we will update the "Date" at the top of this page.
          By continuing to access or use the platform after such changes, you
          agree to be bound by the revised Terms.
        </p>
      </Section>
    </div>
  );
};

export default TermsOfService;
