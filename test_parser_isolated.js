function extractJSON(rawText) {
  if (!rawText) return null;

  try {
    // Remove markdown code blocks
    let cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Find first { and last }
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.warn("extractJSON: could not locate JSON boundaries");
      return null;
    }

    const jsonString = cleaned.substring(start, end + 1);

    return jsonString;

  } catch (err) {
    console.error("extractJSON failure:", err);
    return null;
  }
}

function testDirectorAgentParsing() {
  const simulatedResponse = `
\`\`\`json
{
  "brandStrategy": {
    "brand_personality": ["Innovadora","Eficiente","Profesional"]
  },
  "proposals": [
    { "name": "Tech Minimal", "mood": "Modern Digital" },
    { "name": "Bold Startup", "mood": "Energetic Disruptive" },
    { "name": "Premium Corporate", "mood": "Elegant Trust" },
    { "name": "Future AI", "mood": "Experimental Innovation" },
    { "name": "Human Friendly", "mood": "Warm Accessible" }
  ]
}
\`\`\`
  `;

  console.log("RAW AI RESPONSE (SIMULATED):\\n", simulatedResponse);

  const cleanedJSON = extractJSON(simulatedResponse);

  console.log("EXTRACTED JSON:\\n", cleanedJSON);

  let parsed = null;

  try {
    parsed = cleanedJSON ? JSON.parse(cleanedJSON) : null;
  } catch (err) {
    console.error("JSON PARSE FAILED:", err);
  }

  if (!parsed) {
    parsed = {
      proposals: []
    };
  }
  
  console.log("PARSED JSON:\\n", parsed);
}

testDirectorAgentParsing();
