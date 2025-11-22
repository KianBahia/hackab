/**
 * OpenJustice API Client
 * Handles all API interactions with the OpenJustice service
 *
 * Based on the example from OpenJustice API documentation
 */

const FIXED_CONVERSATION_ID = "4lcb3vr3x";

/**
 * Get API configuration from environment variables
 */
export function getApiConfig() {
  const apiKey = import.meta.env.VITE_OPENJUSTICE_API_KEY;
  const apiUrl =
    import.meta.env.VITE_OPENJUSTICE_API_URL ||
    "https://api.staging.openjustice.ai";
  // dialogFlowId may be required by the API endpoint even though API key handles routing
  // If not provided, we'll need to get it from the API key configuration or user input
  const dialogFlowId = import.meta.env.VITE_DIALOG_FLOW_ID;

  if (!apiKey) {
    throw new Error("API key not found. Please check your .env file.");
  }

  return { apiKey, apiUrl, dialogFlowId };
}

/**
 * Send a message to the conversation
 * @param {string} message - The message to send
 * @param {string} apiKey - API key for authentication
 * @param {string} apiUrl - Base API URL
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<string>} The conversation ID
 */
async function sendMessage(message, apiKey, apiUrl, conversationId) {
  const response = await fetch(`${apiUrl}/conversation/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId: conversationId,
      title: null,
      prompt: null,
      messages: [
        {
          role: "user",
          content: message,
          model: "gpt-4o-mini-2024-07-18",
        },
      ],
    }),
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
 * @param {Function} onUpdate - Callback to update the response as it streams (receives text string)
 * @returns {Promise<Object>} The complete response
 */
export async function processTextMessage(message, onUpdate) {
  const { apiKey, apiUrl, dialogFlowId } = getApiConfig();

  // Step 1: Send message to the fixed conversation
  console.log(`Sending message to conversation ${FIXED_CONVERSATION_ID}...`);
  let conversationId;
  try {
    conversationId = await sendMessage(
      message,
      apiKey,
      apiUrl,
      FIXED_CONVERSATION_ID
    );
    console.log("Message sent. Conversation ID:", conversationId);
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }

  // Step 2: Start streaming the response
  console.log("Starting stream...");
  const fullResponse = await startStream(
    conversationId,
    apiKey,
    apiUrl,
    dialogFlowId,
    onUpdate
  );

  fullResponse.message = message;
  return fullResponse;
}
