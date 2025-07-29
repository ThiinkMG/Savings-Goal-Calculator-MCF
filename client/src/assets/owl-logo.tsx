export function OwlLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" fill="currentColor" className="text-brand-blue" />
      
      {/* Owl Body */}
      <ellipse cx="50" cy="65" rx="25" ry="30" fill="white" />
      
      {/* Owl Head */}
      <circle cx="50" cy="40" r="22" fill="white" />
      
      {/* Eyes */}
      <circle cx="42" cy="35" r="8" fill="currentColor" className="text-brand-blue" />
      <circle cx="58" cy="35" r="8" fill="currentColor" className="text-brand-blue" />
      <circle cx="42" cy="35" r="4" fill="white" />
      <circle cx="58" cy="35" r="4" fill="white" />
      <circle cx="43" cy="33" r="2" fill="black" />
      <circle cx="59" cy="33" r="2" fill="black" />
      
      {/* Beak */}
      <polygon points="50,42 47,48 53,48" fill="currentColor" className="text-brand-amber" />
      
      {/* Ear Tufts */}
      <polygon points="32,20 38,35 28,35" fill="currentColor" className="text-brand-blue" />
      <polygon points="68,20 72,35 62,35" fill="currentColor" className="text-brand-blue" />
      
      {/* Graduation Cap */}
      <rect x="35" y="15" width="30" height="4" fill="black" />
      <polygon points="50,15 40,10 60,10" fill="black" />
      <circle cx="65" cy="12" r="2" fill="currentColor" className="text-brand-amber" />
      
      {/* Wing Details */}
      <ellipse cx="35" cy="55" rx="8" ry="15" fill="currentColor" className="text-brand-blue opacity-20" />
      <ellipse cx="65" cy="55" rx="8" ry="15" fill="currentColor" className="text-brand-blue opacity-20" />
    </svg>
  );
}
