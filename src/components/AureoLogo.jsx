// components/AureoLogo.jsx
export default function AureoLogo() {
    return (
      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 150 150" 
        style={{
          display: 'block',
          margin: '0 auto',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}
      >
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC000" />  {/* React uses camelCase */}
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        
        {/* Animated outer circle */}
        <circle 
          cx="75" 
          cy="75" 
          r="60" 
          fill="none" 
          stroke="url(#g1)" 
          strokeWidth="4"
          style={{
            animation: 'rotate 20s linear infinite',
            transformOrigin: '75px 75px'
          }}
        />
        
        {/* Middle circle */}
        <circle 
          cx="75" 
          cy="75" 
          r="50" 
          fill="none" 
          stroke="url(#g1)" 
          strokeWidth="4"
          style={{
            animation: 'rotate 15s linear infinite reverse',
            transformOrigin: '75px 75px'
          }}
        />
        
        {/* Inner circle */}
        <circle 
          cx="75" 
          cy="75" 
          r="40" 
          fill="none" 
          stroke="url(#g1)" 
          strokeWidth="4"
          style={{
            animation: 'rotate 10s linear infinite',
            transformOrigin: '75px 75px'
          }}
        />
        
        <style jsx>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </svg>
    );
  }