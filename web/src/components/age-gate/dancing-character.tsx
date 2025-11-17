export function DancingCharacter() {
  return (
    <div className="relative flex items-center justify-center">
      <style jsx>{`
        @keyframes dance {
          0%, 100% {
            transform: translateY(0) rotate(-2deg);
          }
          25% {
            transform: translateY(-10px) rotate(2deg);
          }
          50% {
            transform: translateY(0) rotate(-2deg);
          }
          75% {
            transform: translateY(-8px) rotate(1deg);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }

        @keyframes tilt-mug {
          0%, 100% {
            transform: rotate(5deg) translateY(0);
          }
          50% {
            transform: rotate(-10deg) translateY(-3px);
          }
        }

        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(0.5);
            opacity: 0;
          }
        }

        .dancing-character {
          animation: dance 1.5s ease-in-out infinite;
        }

        .swaying-arm {
          animation: sway 1.2s ease-in-out infinite;
          transform-origin: top center;
        }

        .tilting-mug {
          animation: tilt-mug 1.5s ease-in-out infinite;
        }

        .bubble {
          animation: bubble 2s ease-out infinite;
        }

        .bubble:nth-child(2) {
          animation-delay: 0.5s;
        }

        .bubble:nth-child(3) {
          animation-delay: 1s;
        }
      `}</style>

      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dancing-character"
      >
        {/* Character Body */}
        <g>
          {/* Head */}
          <circle cx="100" cy="50" r="25" fill="#10b981" opacity="0.9" />
          
          {/* Eyes */}
          <circle cx="92" cy="48" r="3" fill="#fff" />
          <circle cx="108" cy="48" r="3" fill="#fff" />
          
          {/* Smile */}
          <path
            d="M 90 55 Q 100 62 110 55"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Body */}
          <ellipse cx="100" cy="100" rx="30" ry="35" fill="#10b981" opacity="0.8" />
          
          {/* Left Leg */}
          <rect x="85" y="130" width="10" height="40" rx="5" fill="#10b981" />
          
          {/* Right Leg */}
          <rect x="105" y="130" width="10" height="40" rx="5" fill="#10b981" />
          
          {/* Left Foot */}
          <ellipse cx="90" cy="175" rx="12" ry="6" fill="#065f46" />
          
          {/* Right Foot */}
          <ellipse cx="110" cy="175" rx="12" ry="6" fill="#065f46" />
          
          {/* Right Arm (holding beer) */}
          <g className="swaying-arm">
            <rect x="125" y="85" width="8" height="35" rx="4" fill="#10b981" />
          </g>

          {/* Left Arm */}
          <rect x="67" y="85" width="8" height="35" rx="4" fill="#10b981" />
        </g>

        {/* Beer Mug */}
        <g className="tilting-mug">
          {/* Mug body */}
          <rect x="135" y="75" width="25" height="35" rx="3" fill="#FFA500" opacity="0.9" />
          
          {/* Beer foam */}
          <ellipse cx="147.5" cy="73" rx="14" ry="8" fill="#FFF5E1" />
          <circle cx="140" cy="70" r="4" fill="#FFF5E1" />
          <circle cx="155" cy="72" r="3" fill="#FFF5E1" />
          
          {/* Handle */}
          <path
            d="M 160 85 Q 170 95 160 105"
            stroke="#FFA500"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Bubbles */}
          <circle className="bubble" cx="145" cy="95" r="2" fill="#FFE4B5" opacity="0.8" />
          <circle className="bubble" cx="150" cy="100" r="1.5" fill="#FFE4B5" opacity="0.8" />
          <circle className="bubble" cx="143" cy="105" r="2" fill="#FFE4B5" opacity="0.8" />
        </g>

        {/* Confetti/Stars for Party Vibe */}
        <g opacity="0.6">
          <circle cx="40" cy="40" r="3" fill="#FFA500">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="160" cy="45" r="2" fill="#10b981">
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <path
            d="M 50 140 L 52 145 L 57 146 L 52 149 L 50 154 L 48 149 L 43 146 L 48 145 Z"
            fill="#FFA500"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 147"
              to="360 50 147"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M 150 140 L 152 145 L 157 146 L 152 149 L 150 154 L 148 149 L 143 146 L 148 145 Z"
            fill="#10b981"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 150 147"
              to="360 150 147"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>
  );
}

