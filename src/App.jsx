import { useState } from "react";
import LandingPage from "./LandingPage";
import { processImageWithDescription } from "./api/openjusticeApi";
import titleLogo from "../public/title2.svg";

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoHome = () => {
    setHasLaunched(false);
    setImage(null);
    setImagePreview(null);
    setDescription("");
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !description.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse("");

    try {
      const fullResponse = await processImageWithDescription(
        image,
        description,
        (updatedResponse) => {
          // This callback is called as the response streams in
          setResponse(updatedResponse);
        }
      );

      // Final update with complete response
      setResponse(JSON.stringify(fullResponse, null, 2));
    } catch (err) {
      setError(
        err.message || "An error occurred while processing your request."
      );
      setResponse("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById("image-upload");
    if (fileInput) {
      fileInput.value = "";
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
        <div className="relative z-30 pt-8 md:pt-12 flex justify-center">
          <img
            src={titleLogo}
            alt="hackab logo"
            className="w-56 md:w-80 select-none"
            draggable={false}
          />
        </div>
        <p className="text-center text-black/80 mb-12 text-lg md:text-xl font-medium">
          Upload an image and describe what you'd like to do with it
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="border-4 border-dashed border-black/30 rounded-xl p-8 bg-black/20 backdrop-blur-sm transition-all duration-300 hover:border-black/50 hover:bg-black/30 min-h-[300px] md:min-h-[300px] flex items-center justify-center relative">
                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-[500px] md:max-h-[500px] rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/80 text-white border-2 border-white text-2xl cursor-pointer flex items-center justify-center leading-none transition-all duration-200 hover:bg-red-600 hover:scale-110"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-black/70 text-center">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-black"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="m-0 text-lg font-bold text-black">
                      Click to upload an image
                    </p>
                    <span className="text-sm text-black/60">
                      or drag and drop
                    </span>
                  </div>
                )}
              </div>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="description"
              className="font-bold text-base text-black"
            >
              Description / Prompt
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'd like to do with this image..."
              className="w-full p-4 border-4 border-black/30 rounded-lg bg-black/20 backdrop-blur-sm text-black font-inherit text-base resize-y transition-all duration-300 focus:outline-none focus:border-black/50 focus:bg-black/30 placeholder:text-black/50 font-medium"
              rows="5"
            />
          </div>

          <button
            type="submit"
            className="px-8 py-4 text-lg font-bold text-white bg-black border-4 border-white rounded-lg cursor-pointer transition-all duration-300 mt-2 hover:scale-105 hover:bg-gray-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            disabled={!image || !description.trim() || isLoading}
          >
            {isLoading ? "Processing..." : "Process Image"}
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
            <label className="font-bold text-base text-black">
              API Response
            </label>
            <textarea
              readOnly
              value={response}
              className="w-full p-4 border-4 border-black/30 rounded-lg bg-black/20 backdrop-blur-sm text-black font-mono text-sm resize-y transition-all duration-300 focus:outline-none focus:border-black/50 focus:bg-black/30"
              rows="10"
              style={{ minHeight: "200px" }}
            />
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
