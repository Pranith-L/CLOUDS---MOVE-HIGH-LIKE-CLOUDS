import express from 'express';
import fetch from 'node-fetch';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate AI image via HuggingFace Inference API
router.post('/generate-image', authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required.' });

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfKey || hfKey === 'hf_your_huggingface_api_key_here') {
      return res.status(503).json({ message: 'AI service not configured. Please add your HuggingFace API key.' });
    }

    // Use Stable Diffusion model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `${prompt}, tshirt print design, vector art, high quality, centered, white background`,
          parameters: { num_inference_steps: 30, guidance_scale: 7.5 }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      // Model loading - tell client to retry
      if (response.status === 503) {
        return res.status(503).json({ message: 'AI model is loading, please retry in 20 seconds.' });
      }
      return res.status(response.status).json({ message: `HuggingFace error: ${errText}` });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    res.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
