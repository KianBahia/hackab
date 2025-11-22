import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import { processTextMessage } from "./api/openjusticeApi";

function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Chat messages array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleGoHome = () => {
    setHasLaunched(false);
    setImage(null);
    setImagePreview(null);
    setMessage("");
    setMessages([]);
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

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById("image-upload");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    const currentImage = image;

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        image: currentImage ? imagePreview : null,
      },
    ]);

    // Clear input only (keep image for next message)
    setMessage("");
    // Don't clear image - it stays in the upload area until user replaces it

    setIsLoading(true);
    setError(null);

    // Add placeholder for AI response
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        isLoading: true,
      },
    ]);

    try {
      await processTextMessage(userMessage, currentImage, (updatedResponse) => {
        // Update the last AI message as it streams
        setMessages((prev) => {
          const newMessages = [...prev];
          // Find the last assistant message and update it
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === "assistant") {
              newMessages[i] = {
                role: "assistant",
                content: updatedResponse,
                isLoading: false,
              };
              break;
            }
          }
          return newMessages;
        });
      });
    } catch (err) {
      setError(
        err.message || "An error occurred while processing your request."
      );
      // Update the last AI message with error
      setMessages((prev) => {
        const newMessages = [...prev];
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === "assistant") {
            newMessages[i] = {
              role: "assistant",
              content: `Error: ${err.message || "An error occurred"}`,
              isLoading: false,
            };
            break;
          }
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#ff4201] flex flex-col">
      {/* Home button and Toggle switch in top left */}
      <div className="absolute top-6 left-6 z-40 flex gap-3 items-center">
        <HomeButton onHome={handleGoHome} />
        <ModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>

      {/* Title */}
      <div className="pt-16 pb-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight drop-shadow-lg">
          hackab
        </h1>
      </div>

      {/* Split layout: Left (Image) and Right (Chat) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Left Side: Image Upload and Display */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex-1 border-4 border-black/30 rounded-xl bg-black/20 backdrop-blur-sm p-4 flex flex-col">
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex-1 flex items-center justify-center"
            >
              <div className="w-full h-full border-4 border-dashed border-black/30 rounded-lg transition-all duration-300 hover:border-black/50 flex items-center justify-center relative min-h-[400px]">
                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 text-white border-2 border-white text-xl cursor-pointer flex items-center justify-center leading-none transition-all duration-200 hover:bg-red-600 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-black/70 text-center p-8">
                    <svg
                      width="64"
                      height="64"
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
        </div>

        {/* Right Side: Chat Interface */}
        <div
          className="w-full md:w-1/2 flex flex-col border-4 border-black/30 rounded-xl bg-black/20 backdrop-blur-sm overflow-hidden"
          style={{ height: "calc(100vh - 200px)", maxHeight: "800px" }}
        >
          {/* Chat Messages Area - Fixed height with internal scrolling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-black/60">
                <p>Start a conversation...</p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-black/40 text-white"
                          : "bg-black/30 text-black"
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="User uploaded"
                          className="max-w-full max-h-48 rounded mb-2 object-contain"
                        />
                      )}
                      <div className="whitespace-pre-wrap font-mono text-sm">
                        {msg.content || (msg.isLoading ? "..." : "")}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
            {isLoading && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-black/30 text-black rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      .
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-500/20 border-2 border-red-500 rounded-lg">
              <p className="text-red-800 font-bold text-sm">Error:</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t-4 border-black/30"
          >
            <div className="flex gap-2">
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 border-4 border-black/30 rounded-lg bg-black/20 backdrop-blur-sm text-black font-inherit text-sm resize-none transition-all duration-300 focus:outline-none focus:border-black/50 focus:bg-black/30 placeholder:text-black/50"
                rows="2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="px-6 py-3 font-bold text-white bg-black border-4 border-white rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-gray-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
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
