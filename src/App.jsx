import { useState } from "react";
import LandingPage from "./LandingPage";
import { processTextMessage } from "./api/openjusticeApi";

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoHome = () => {
    setHasLaunched(false);
    setMessage("");
    setResponse("");
    setError(null);
    setIsLoading(false);
  };

  if (!hasLaunched) {
    return (
      <LandingPage
        onLaunch={() => setHasLaunched(true)}
        onHome={handleGoHome}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse("");

    try {
      const fullResponse = await processTextMessage(
        message,
        (updatedResponse) => {
          // This callback receives the streaming text output
          setResponse(updatedResponse);
        }
      );
      // Final update with complete response if needed
      if (fullResponse.outputText) {
        setResponse(fullResponse.outputText);
      }
    } catch (err) {
      setError(
        err.message || "An error occurred while processing your request."
      );
      setResponse("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#ff4201]">
      {/* Home button and Toggle switch in top left */}
      <div className="absolute top-6 left-6 z-40 flex gap-3 items-center">
        <HomeButton onHome={handleGoHome} />
        <ModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-center mb-8 text-5xl md:text-6xl font-black text-black tracking-tight drop-shadow-lg">
          hackab
        </h1>
        <p className="text-center text-black/80 mb-12 text-lg md:text-xl font-medium">
          Enter your message
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label htmlFor="message" className="font-bold text-base text-black">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              className="w-full p-4 border-4 border-black/30 rounded-lg bg-black/20 backdrop-blur-sm text-black font-inherit text-base resize-y transition-all duration-300 focus:outline-none focus:border-black/50 focus:bg-black/30 placeholder:text-black/50 font-medium"
              rows="5"
            />
          </div>

          <button
            type="submit"
            className="px-8 py-4 text-lg font-bold text-white bg-black border-4 border-white rounded-lg cursor-pointer transition-all duration-300 mt-2 hover:scale-105 hover:bg-gray-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? "Processing..." : "Send Message"}
          </button>
        </form>

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
            <p className="text-red-800 font-bold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Response display */}
        {response && (
          <div className="mt-6 flex flex-col gap-3">
            <label className="font-bold text-base text-black">Response</label>
            <div className="w-full p-4 border-4 border-black/30 rounded-lg bg-black/20 backdrop-blur-sm text-black font-mono text-sm min-h-[200px] whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
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

export default App;
