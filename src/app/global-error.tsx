'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-red-600 font-mono flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">CRITICAL KERNEL PANIC</h1>
        <p className="text-gray-500 mb-8">{error.message}</p>
        <button 
          onClick={() => reset()}
          className="border border-red-600 px-6 py-3 rounded hover:bg-red-600 hover:text-black transition-all"
        >
          FORCE RESTART
        </button>
      </body>
    </html>
  );
}