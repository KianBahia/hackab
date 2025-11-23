import { useState } from "react";
import titleDark from "../public/titleDark.svg";
import titleCute from "../public/titleCute.svg";
import melody from "../public/melody.png";
import melody2 from "../public/melody2.png";

function LandingPage({ onLaunch, onHome, isDarkMode, setIsDarkMode }) {
  return (
    <div className="relative min-h-screen w-full overflow-visible flex flex-col">
      {/* Home button and Toggle switch in top left */}
      <div className="absolute top-6 left-6 z-40 flex gap-3 items-center">
        <HomeButton
          onHome={
            onHome || (() => window.scrollTo({ top: 0, behavior: "smooth" }))
          }
        />
        <ModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>

      {/* Render appropriate mode */}
      {isDarkMode ? (
        <DarkModeDesign onLaunch={onLaunch} />
      ) : (
        <LightModeDesign onLaunch={onLaunch} />
      )}
    </div>
  );
}

function HomeButton({ onHome }) {
  return (
    <button
      onClick={onHome}
      className="px-4 py-2 bg-black border-2 border-white text-white font-bold text-sm cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-gray-900"
      aria-label="Go to home page"
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
        WebkitClipPath:
          "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
      }}
    >
      HOME
    </button>
  );
}

function ModeToggle({ isDarkMode, setIsDarkMode }) {
  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="relative w-16 h-8 bg-black border-2 border-white rounded-full cursor-pointer transition-all duration-300 hover:scale-110"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${
          isDarkMode ? "translate-x-0" : "translate-x-8"
        }`}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white pointer-events-none">
        {isDarkMode ? "DARK" : "LIGHT"}
      </span>
    </button>
  );
}

// Dark Mode Design (current red and black sun design)
function DarkModeDesign({ onLaunch }) {
  return (
    <div className="relative min-h-screen w-full overflow-visible bg-[#ff4201] flex flex-col">
      {/* Title at top */}
      <div className="relative z-30 pt-8 md:pt-12 flex justify-center">
        <img
          src={titleDark}
          alt="hackab logo"
          className="w-56 md:w-80 select-none"
          draggable={false}
        />
      </div>

      {/* Spiky Hexagon at center */}
      <div
        className="flex-1 flex items-center justify-center relative z-10"
        style={{ overflow: "visible" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-sun-pulse">
            <SpikyHexagon />
          </div>
        </div>
      </div>

      {/* Launch button at bottom - Persona 5 inspired */}
      <div className="relative z-30 pb-8 md:pb-12 flex justify-center">
        <div
          className="relative inline-block"
          style={{ transform: "rotate(-2deg)" }}
        >
          {/* Black shadow layer - furthest back */}
          <div
            className="absolute bg-black"
            style={{
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transform: "translate(16px, 16px)",
              clipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              WebkitClipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              zIndex: 1,
              opacity: 0.6,
            }}
          />
          {/* White shadow layer - middle */}
          <div
            className="absolute bg-white"
            style={{
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transform: "translate(8px, 8px)",
              clipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              WebkitClipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              zIndex: 2,
            }}
          />
          {/* Main button - on top */}
          <button
            onClick={onLaunch}
            className="relative px-16 py-5 text-3xl font-black text-white bg-black cursor-pointer transition-all duration-200 hover:scale-105 active:scale-100"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              WebkitClipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              border: "none",
              outline: "none",
              zIndex: 3,
              position: "relative",
            }}
          >
            <span className="relative z-10 tracking-wider">LAUNCH</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Light Mode Design (placeholder - to be designed later)
function LightModeDesign({ onLaunch }) {
  return (
    <div className="relative min-h-screen w-full overflow-visible vichy-bg flex flex-col">
      {/* Title at top */}
      <div className="relative z-30 pt-8 md:pt-12 flex justify-center">
        <img
          src={titleCute}
          alt="hackab logo"
          className="w-56 md:w-80 select-none"
          draggable={false}
        />
      </div>

      {/* Decorative melody image on the right for medium+ screens */}
      <img
        src={melody}
        alt="melody"
        className="hidden md:block absolute right-12 lg:right-20 top-1/2 translate-y-[-25%] w-40 opacity-90 select-none tweak-effect idle"
        draggable={false}
      />

      {/* Decorative melody2 centered and larger on medium+ screens */}
      <img
        src={melody2}
        alt="melody2"
        className="hidden md:block absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 w-56 md:w-72 opacity-90 select-none tweak-effect idle z-0 pointer-events-none"
        draggable={false}
      />

    <div
      className="flex-1 flex items-center justify-center relative z-10"
      style={{ overflow: "visible" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="vichy-bg" style={{ height: "100vh" }}></div>
      </div>
    </div>
  {/* Launch button at bottom */}
      <div className="relative z-30 pb-8 md:pb-12 flex justify-center mt-6 md:mt-10">
        <div className="relative inline-block">
          {/* Soft pastel shadow layer */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              transform: "translate(10px, 10px)",
              background:
                "linear-gradient(135deg, rgba(236,72,153,0.18), rgba(99,102,241,0.12))",
              zIndex: 1,
              filter: "blur(10px)",
            }}
          />

          {/* Cute gradient button */}
          <button
            onClick={onLaunch}
            aria-label="Launch"
            className="relative z-10 flex items-center gap-3 px-10 md:px-14 py-3 md:py-4 bg-gradient-to-br from-pink-500 to-yellow-500 text-white font-extrabold text-xl md:text-3xl rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.18)] transform transition-all duration-300 hover:-translate-y-1 active:scale-95">
            <span className="tracking-wider">LAUNCH</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SpikyHexagon() {
  const spikeCount = 20;
  const spikes = [];
  const hexagonSize = 80; // Size of the hexagon

  // Create long pointy triangular spikes that extend across the page
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i / spikeCount) * 360;
    // Make spikes varied in length - shorter average with more variation
    const length = 120 + Math.random() * 280; // Range: 120-400px (shorter average, more varied)
    const baseWidth = 15 + Math.random() * 10; // Wider base (15-25px)

    spikes.push(
      <div
        key={i}
        className="absolute top-1/2 left-1/2"
        style={{
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transformOrigin: "center center",
          width: 0,
          height: 0,
          overflow: "visible",
        }}
      >
        {/* Triangular spike - wide base at top (near hexagon), pointy tip at bottom (far from hexagon) */}
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${length}px`,
            backgroundColor: "black",
            clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
            WebkitClipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
            transformOrigin: "top center",
            marginLeft: `-${baseWidth / 2}px`,
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
      }}
    >
      {/* Central black hexagon */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black"
        style={{
          width: `${hexagonSize * 2}px`,
          height: `${hexagonSize * 2}px`,
          clipPath:
            "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
          zIndex: 10,
        }}
      />
      {/* Spikes */}
      {spikes}
    </div>
  );
}

export default LandingPage;
