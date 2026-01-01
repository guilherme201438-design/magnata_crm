export function MagnataLogo() {
  return (
    <svg
      viewBox="0 0 200 200"
      width="64"
      height="64"
      className="w-16 h-16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="200" height="200" fill="#1a1a1a" rx="8" />
      
      {/* Left stripe */}
      <path
        d="M 60 40 L 90 80 L 90 160 L 60 160 Z"
        fill="#f59e0b"
      />
      
      {/* Center V shape */}
      <path
        d="M 90 80 L 100 100 L 110 80 L 100 120 Z"
        fill="#f59e0b"
      />
      
      {/* Right stripe */}
      <path
        d="M 110 80 L 140 40 L 140 160 L 110 160 Z"
        fill="#f59e0b"
      />
      
      {/* Play button icon in center */}
      <circle cx="100" cy="100" r="8" fill="#ffffff" opacity="0.8" />
      <path
        d="M 97 97 L 97 103 L 103 100 Z"
        fill="#1a1a1a"
      />
    </svg>
  );
}
