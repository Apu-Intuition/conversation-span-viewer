import { z } from "zod";
import "./style.css";

const dataMessageSchema = z.object({
  type: z.literal("data"),
  data: z.object({
    input: z.object({
      messageHistory: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
    }),
    output: z.string(),
  }),
});

const settingsMessageSchema = z.object({
  type: z.literal("settings"),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    readOnly: z.boolean(),
  }),
});

const messageSchema = z.union([dataMessageSchema, settingsMessageSchema]);

type Data = z.infer<typeof dataMessageSchema>["data"];
type Theme = z.infer<typeof settingsMessageSchema>["settings"]["theme"];

let globalTheme: Theme = "light";

const displayData = ({ input, output }: Data, theme: Theme) => {
  if (theme === "dark") {
    document.body.classList.add("dark");
  }

  const contentDiv = document.getElementById("content");
  if (!contentDiv) {
    return;
  }

  if (input.messageHistory.length === 0) {
    contentDiv.textContent = "No data";
    return;
  }

  contentDiv.innerHTML = "";

  input.messageHistory.forEach((message) => {
    const messageDiv = document.createElement("div");
    // add styles based on role
    messageDiv.classList.add(message.role.toLowerCase(), "message", theme);
    messageDiv.textContent = message.content;
    contentDiv.appendChild(messageDiv);
  });

  const outputDiv = document.createElement("div");
  outputDiv.classList.add("output", "message", "assistant", theme);
  outputDiv.textContent = output;
  contentDiv.appendChild(outputDiv);
};

const handleMessage = (event: { data: unknown }) => {
  console.log("handleMessage ~ event:", event);

  try {
    const message = messageSchema.parse(event.data);
    if (message.type === "data") {
      displayData(message.data, globalTheme);
    }

    if (message.type === "settings") {
      globalTheme = message.settings.theme;
    }
  } catch (error) {
    console.error("Invalid message received:", error);
  }
};

window.addEventListener("message", handleMessage);

if (import.meta.env.DEV) {
  // Mock the data that would be sent by the parent window
  const mockData: Data = {
    input: {
      messageHistory: [
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "Hello" },
      ],
    },
    output: "Hi there!",
  };

  // Display the mock data
  displayData(mockData, globalTheme);
}
