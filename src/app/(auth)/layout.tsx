export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Branding panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-surface border-r border-border p-10 relative overflow-hidden flex-shrink-0">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-blue/5 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">DevRisk AI</p>
            <p className="text-xs text-gray-500">Risk Intelligence Platform</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="mt-auto relative">
          <h2 className="text-2xl font-bold text-white leading-snug">
            AI Risk Intelligence<br />
            <span className="text-gradient">for Scaling Teams</span>
          </h2>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            Translate engineering signals into executive-level risk insights before they impact users and revenue.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { value: '87%', label: 'Risk detected early' },
              { value: '3x',  label: 'Faster incident response' },
              { value: '60%', label: 'Reduced rollbacks' },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-2 rounded-lg p-3 border border-border">
                <p className="text-base font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
