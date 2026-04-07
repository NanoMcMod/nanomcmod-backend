// server.js - NanoMCMod Backend (Noob-friendly!)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config(); // Lädt .env-Datei

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Erlaubt Anfragen von deiner GitHub Pages-Seite
app.use(express.json());

// 🔑 API-Clients initialisieren (Keys aus .env)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 🏠 Health-Check Endpoint
app.get('/', (req, res) => {
  res.json({ status: '🟢 NanoMCMod Backend läuft!', version: '0.1 Beta' });
});

// 🎯 Haupt-Endpoint: Mod generieren
app.post('/api/generate-mod', async (req, res) => {
  try {
    const { provider, description } = req.body;
    
    if (!provider || !description) {
      return res.status(400).json({ error: 'Provider und Beschreibung erforderlich' });
    }

    console.log(`🔄 Generiere Mod mit ${provider}: "${description}"`);

    let generatedCode;
    
    // 🤖 KI-Auswahl
    switch (provider) {
      case 'openai':
        generatedCode = await generateWithOpenAI(description);
        break;
      case 'anthropic':
        generatedCode = await generateWithAnthropic(description);
        break;
      case 'google':
        generatedCode = await generateWithGoogle(description);
        break;
      case 'qwen':
        // Qwen über OpenAI-compatible API (DashScope)
        generatedCode = await generateWithQwen(description);
        break;
      default:
        return res.status(400).json({ error: 'Unbekannter Provider' });
    }

    // 📦 Antwort mit Code + Download-Links (Demo: Placeholder)
    res.json({
      success: true,
      sourceCode: generatedCode,
      downloadLinks: {
        srcZip: '/download/src/example-mod.zip', // Später: echter Build
        jar: '/download/mod/example-mod.jar'
      },
      message: '✅ Mod generiert! (Demo-Modus)'
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
    res.status(500).json({ 
      error: 'Server-Fehler', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// 🧠 KI-Funktionen (vereinfacht für Noobs)
async function generateWithOpenAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Günstig & gut für Mods
    messages: [
      { role: 'system', content: 'Du bist ein Minecraft Mod-Experte. Erstelle nur validen Forge 1.20.1 Java-Code. Keine Erklärungen, nur Code.' },
      { role: 'user', content: `Erstelle eine Minecraft Mod: ${prompt}` }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  return completion.choices[0].message.content;
}

async function generateWithAnthropic(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307', // Schnell & günstig
    max_tokens: 2000,
    system: 'Du bist ein Minecraft Mod-Experte. Erstelle nur validen Forge 1.20.1 Java-Code. Keine Erklärungen, nur Code.',
    messages: [{ role: 'user', content: `Erstelle eine Minecraft Mod: ${prompt}` }]
  });
  return message.content[0].text;
}

async function generateWithGoogle(prompt) {
  const model = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    'Du bist ein Minecraft Mod-Experte. Erstelle nur validen Forge 1.20.1 Java-Code. Keine Erklärungen, nur Code.',
    `Erstelle eine Minecraft Mod: ${prompt}`
  ]);
  return result.response.text();
}

async function generateWithQwen(prompt) {
  // Qwen über OpenAI-compatible API (DashScope)
  const completion = await openai.chat.completions.create({
    model: 'qwen-turbo', // Oder qwen-plus
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY,
    messages: [
      { role: 'system', content: 'Du bist ein Minecraft Mod-Experte. Erstelle nur validen Forge 1.20.1 Java-Code.' },
      { role: 'user', content: `Erstelle eine Minecraft Mod: ${prompt}` }
    ],
    max_tokens: 2000
  });
  return completion.choices[0].message.content;
}

// 🚀 Server starten
app.listen(PORT, () => {
  console.log(`🎮 NanoMCMod Backend läuft auf http://localhost:${PORT}`);
  console.log(`🔗 Health-Check: http://localhost:${PORT}/`);
});
