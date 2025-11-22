/**
 * OpenJustice API Client
 * Handles all API interactions with the OpenJustice service
 *
 * Based on the example from OpenJustice API documentation
 */

/**
 * Get API configuration from environment variables
 * All API-related configuration is stored in .env file
 */
export function getApiConfig() {
  const apiKey = import.meta.env.VITE_OPENJUSTICE_API_KEY;
  const apiUrl =
    import.meta.env.VITE_OPENJUSTICE_API_URL ||
    "https://api.staging.openjustice.ai";
  const dialogFlowId = import.meta.env.VITE_DIALOG_FLOW_ID;
  const conversationId = import.meta.env.VITE_CONVERSATION_ID;

  if (!apiKey) {
    throw new Error("API key not found. Please check your .env file.");
  }

  if (!dialogFlowId) {
    throw new Error(
      "Dialog flow ID not found. Please set VITE_DIALOG_FLOW_ID in your .env file."
    );
  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID not found. Please set VITE_CONVERSATION_ID in your .env file."
    );
  }

  return { apiKey, apiUrl, dialogFlowId, conversationId };
}

/**
 * Upload a file to OpenJustice
 * @param {File} file - The file to upload
 * @param {string} apiKey - API key for authentication
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<{resourceId: string, fileName: string}>}
 */
export async function uploadFile(file, apiKey, apiUrl) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/conversation/resources/upload-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  if (!result.ok || !result.resourceId) {
    throw new Error("Failed to upload file: Invalid response");
  }

  return {
    resourceId: result.resourceId,
    fileName: result.fileName,
  };
}

/**
 * Send a message to the conversation
 * @param {string} message - The message to send
 * @param {string} apiKey - API key for authentication
 * @param {string} apiUrl - Base API URL
 * @param {string} conversationId - Conversation ID
 * @param {Array|null} uploadedFiles - Optional array of uploaded file resources [{id, name}]
 * @returns {Promise<string>} The conversation ID
 */
async function sendMessage(
  message,
  apiKey,
  apiUrl,
  conversationId,
  uploadedFiles = null
) {
  const messagePayload = {
    conversationId: conversationId,
    title: null,
    prompt: null,
    messages: [
      {
        role: "user",
        content: message,
        model: "gpt-4o-mini-2024-07-18",
        ...(uploadedFiles &&
          uploadedFiles.length > 0 && {
            metadata: {
              resources: uploadedFiles,
            },
          }),
      },
    ],
  };

  const response = await fetch(`${apiUrl}/conversation/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.conversationId;
}

/**
 * Process Server-Sent Events from the stream
 * Based on the example implementation
 * @param {string} eventText - The raw SSE event text
 * @param {Object} fullResponse - The response object being built
 * @param {Function} onUpdate - Callback to update the response
 */
function processEvent(eventText, fullResponse, onUpdate) {
  const lines = eventText.split("\n").filter((line) => line.trim());
  let eventType = "message"; // Default SSE event type
  let data = "";

  // Parse SSE format: event: <type> and data: <content>
  const dataLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("event:")) {
      eventType = trimmedLine.substring(6).trim();
    } else if (trimmedLine.startsWith("data:")) {
      // Handle multi-line data (SSE allows data: on multiple lines)
      const dataContent = trimmedLine.substring(5);
      dataLines.push(dataContent);
    }
  }

  // Join multiple data lines with newline (SSE spec)
  data = dataLines.join("\n");

  if (!data) return;

  try {
    const parsed = JSON.parse(data);

    switch (eventType) {
      case "message":
        if (parsed.text) {
          fullResponse.outputText += parsed.text;
          onUpdate(fullResponse.outputText);
        }
        break;

      case "node-result": {
        const node = parsed;
        // For running nodes, show just the header
        if (node.status === "running") {
          const description = node.description || "in progress";
          const nodeInfo = `\n━━━━━━ ${node.nodeType.toUpperCase()}: ${
            node.title
          } (${description}) ━━━━━━\n`;
          fullResponse.outputText += nodeInfo;
          onUpdate(fullResponse.outputText);
          break;
        }

        // For completed nodes, show the full content with borders
        if (node.status === "completed" && node.nodeType !== "outcome") {
          // Show the final output data with borders
          if (node.data && Object.keys(node.data).length > 0) {
            const nodeData = `\n${JSON.stringify(node.data, null, 2)}\n\n`;
            fullResponse.outputText += nodeData;
            onUpdate(fullResponse.outputText);
          }
        }
        break;
      }

      case "awaiting-user-input": {
        const input = parsed;
        const inputInfo = `\n\n[Awaiting user input - Execution ID: ${input.executionId}]\n`;
        fullResponse.outputText += inputInfo;
        fullResponse.complete = true;
        onUpdate(fullResponse.outputText);
        break;
      }

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled event type: ${eventType}`, parsed);
    }
  } catch (error) {
    // Silently ignore parse errors for simplicity
    console.debug("Could not parse SSE event:", error);
  }
}

/**
 * Stream the dialog flow execution
 * Based on the example implementation
 * @param {string} conversationId - The conversation ID
 * @param {string} apiKey - API key for authentication
 * @param {string} apiUrl - Base API URL
 * @param {string|null} dialogFlowId - Dialog flow ID (required by API endpoint)
 * @param {Function} onUpdate - Callback to update the response as it streams
 * @returns {Promise<Object>} The complete response object
 */
async function startStream(
  conversationId,
  apiKey,
  apiUrl,
  dialogFlowId,
  onUpdate
) {
  // The API endpoint requires dialogFlowId even though the API key handles routing
  // Following the example pattern: dialogFlowId + conversationId for new execution
  // You can find your dialogFlowId in the OpenJustice dashboard where you created the API key
  if (!dialogFlowId) {
    throw new Error(
      "dialogFlowId is required for streaming. Please set VITE_DIALOG_FLOW_ID in your .env file.\n" +
        "You can find your dialogFlowId in the OpenJustice dashboard where you created the API key."
    );
  }

  const url = `${apiUrl}/nap/stream?dialogFlowId=${encodeURIComponent(
    dialogFlowId
  )}&conversationId=${encodeURIComponent(conversationId)}`;

  console.log("Starting stream for conversation:", conversationId);
  console.log("Using dialogFlowId:", dialogFlowId);
  console.log("Stream URL:", url);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}: ${errorText}`);
      throw new Error(
        `Failed to start stream: ${response.status} ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const fullResponse = {
      success: true,
      conversationId: conversationId,
      outputText: "",
      complete: false,
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    console.log("Reading stream...");

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) processEvent(buffer, fullResponse, onUpdate);
        fullResponse.complete = true;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventText of events) {
        if (eventText.trim()) {
          processEvent(eventText, fullResponse, onUpdate);
        }
      }
    }

    console.log("Stream completed");
    return fullResponse;
  } catch (error) {
    console.error(
      `Stream error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}

/**
 * Process a text message through the OpenJustice API
 * Main function that sends a message and streams the response
 *
 * @param {string} message - User's text message
 * @param {File|null} image - Optional image file to upload and attach
 * @param {Function} onUpdate - Callback to update the response as it streams (receives text string)
 * @returns {Promise<Object>} The complete response
 */
export async function processTextMessage(message, image = null, onUpdate) {
  const { apiKey, apiUrl, dialogFlowId, conversationId } = getApiConfig();

  // Step 1: Upload image if provided
  let uploadedFiles = null;
  if (image) {
    console.log("Uploading image file...");
    try {
      const uploadedFile = await uploadFile(image, apiKey, apiUrl);
      console.log("Image uploaded:", uploadedFile);
      uploadedFiles = [
        {
          id: uploadedFile.resourceId,
          name: uploadedFile.fileName,
        },
      ];
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  }

  // Step 2: Send message to the conversation (with image if provided)
  console.log(`Sending message to conversation ${conversationId}...`);
  let returnedConversationId;
  try {
    returnedConversationId = await sendMessage(
      message,
      apiKey,
      apiUrl,
      conversationId,
      uploadedFiles
    );
    console.log("Message sent. Conversation ID:", returnedConversationId);
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }

  // Step 3: Start streaming the response
  console.log("Starting stream...");
  const fullResponse = await startStream(
    returnedConversationId,
    apiKey,
    apiUrl,
    dialogFlowId,
    onUpdate
  );

  fullResponse.message = message;
  if (uploadedFiles) {
    fullResponse.uploadedFile = uploadedFiles[0];
  }
  return fullResponse;
}
