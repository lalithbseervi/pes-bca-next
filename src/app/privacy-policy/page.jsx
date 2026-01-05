'use client';
import { useEffect, useState } from "react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-semibold mt-6 mb-4">{title}</h2>
    <div className="text-md text-neutral-300">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
  // State to ensure client-side rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 md:mt-0 md:pt-0 p-4">
      <h1 className="text-3xl font-semibold text-center mb-6">
        Privacy and Cookie Policy
      </h1>
      <p className="text-base text-center mb-8">Last Updated: 29-11-25</p>

      <p className="text-lg mb-6">
        Below is a detailed outline of how and what data is collected, used, and stored as you use this site.
      </p>

      {/* Data Collection Section */}
      <Section title="Data Collection">
        <p>PostHog analytics is used to collect the following data:</p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li>Login events</li>
          <li>Autocapture events (button clicks, console errors, etc.)</li>
          <li>Session Recordings (reconstruction of your actions on the site after logging in)</li>
        </ul>
        <p>
          This data helps in understanding what aspects of the site need more focus/improvement and which are performing well.
        </p>
      </Section>

      {/* Data Usage Section */}
      <Section title="Data Usage">
        <p>
          The data collected is used only for improving the site, fixing and identifying bugs, and performance improvements.
          <span className="font-semibold"> No data is shared with any third party.</span>
        </p>
      </Section>

      {/* Data Retention Section */}
      <Section title="Data Retention">
        <p>The aforementioned data is stored securely within PostHog and periodically deleted.</p>
        <p>Session Recordings are deleted by PostHog automatically if a recording is older than 30 days.</p>
        <p>
          Please note that Session Recordings are not literal screen recordings, but simply a reconstruction of what actions you take.
        </p>
        <p>This means that notifications, battery percentages, and anything outside the site is not captured. Further, no textual input is visible as it is masked as ****</p>
      </Section>

      {/* Changes to Policy Section */}
      <Section title="Changes to this Policy">
        <p>
          This policy will be updated as and when required. Changes will be updated on this page in advance.
        </p>
      </Section>
    </div>
  );
};

export default PrivacyPolicy;
