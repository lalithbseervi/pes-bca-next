import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-gray-100 dark:text-white py-6 text-center text-sm md:text-base">
      <p>
        Built with ❤️ using <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400 transition-colors">Next.js</a>
      </p>
      <p>&copy; 2025 lms</p>
      <div className="mt-4">
        <Link href="/privacy-policy" className="underline hover:text-blue-400 transition-colors mr-4">Privacy Policy</Link>
        <Link href="/terms-of-service" className="underline hover:text-blue-400 transition-colors">Terms of Service</Link>
      </div>
    </footer>
  );
}
