"use client";

const testimonials = [
  {
    quote: "Finally, a goal tracker that doesn't try to gamify everything. Just honest progress tracking.",
    author: "Sarah K.",
    role: "Running 1000 miles this year",
    avatar: "🏃‍♀️",
  },
  {
    quote: "The pace indicator is genius. I always know if I need to push harder or can take a break.",
    author: "Marcus T.",
    role: "Reading 52 books",
    avatar: "📚",
  },
  {
    quote: "Simple, fast, and it syncs everywhere. Exactly what I needed.",
    author: "Jamie L.",
    role: "Daily meditation streak",
    avatar: "🧘",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by goal-setters
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands tracking their progress with Tally
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
            >
              <p className="text-gray-700 mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t.author}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <p className="text-4xl font-bold text-gray-900">10K+</p>
            <p className="text-sm text-gray-600 mt-1">Goals tracked</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">500K+</p>
            <p className="text-sm text-gray-600 mt-1">Entries logged</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">95%</p>
            <p className="text-sm text-gray-600 mt-1">Completion rate</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">4.9</p>
            <p className="text-sm text-gray-600 mt-1">User rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
