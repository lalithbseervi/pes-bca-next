export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 text-center text-sm md:text-base">
      <p>
        Built with ❤️ using <a href="https://nextjs.org" className="underline">Next.js</a>
      </p>
      <p>&copy; 2025 pes-bca</p>
      <div className="mt-4">
        <a href="/privacy-policy" className="underline mr-4">Privacy Policy</a>
        <a href="/terms-of-service" className="underline">Terms of Service</a>
      </div>
    </footer>
  );
}
