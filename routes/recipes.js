const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
require('dotenv').config();

const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

router.get('/suggestions/:ingredient', async (req, res) => {
  try {
    // Check if API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error('HUGGINGFACE_API_KEY is missing from environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured'
      });
    }

    const ingredient = req.params.ingredient;
    
    // Normalize the ingredient - remove "fruit" suffix if present
    const normalizedIngredient = ingredient.toLowerCase()
      .replace(/\s+fruit$/, '')
      .trim();
    
    console.log(`Generating recipes for ingredient: ${normalizedIngredient}`);
    
    // Create a prompt for the model
    const prompt = `Suggest two simple dishes I can make with ${normalizedIngredient}. Include a brief description for each dish.`;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hugging Face API error: ${response.status}`, errorText);
        return res.status(response.status).json({ 
          error: 'AI API error',
          message: `Status ${response.status}: ${errorText}`
        });
      }
      
      const data = await response.json();
      
      // Check if data has the expected format
      if (!data[0] || !data[0].generated_text) {
        console.error('Unexpected response format from AI API:', data);
        return res.status(500).json({ 
          error: 'AI response error',
          message: 'Received unexpected data format from AI service'
        });
      }
      
      // Format the response into recipe suggestions
      const formattedResponse = formatRecipes(data[0].generated_text, normalizedIngredient);
      
      res.json(formattedResponse);
    } catch (apiError) {
      console.error('AI service error:', apiError);
      res.status(500).json({ 
        error: 'AI service error',
        message: apiError.message
      });
    }
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    res.status(500).json({ 
      error: 'Failed to get recipe suggestions',
      message: error.message
    });
  }
});

function formatRecipes(text, ingredient) {
  // Split the model output into separate recipes
  const recipes = text.split(/\d\.\s+/).filter(r => r.trim().length > 0);
  
  // Format into structured recipes
  const formattedRecipes = recipes.map(recipe => {
    // Try to extract a title and description
    const titleMatch = recipe.match(/^([^:.]+)[:.](.+)$/);
    if (titleMatch) {
      return {
        title: titleMatch[1].trim(),
        description: titleMatch[2].trim()
      };
    }
    
    // If no clear title/description format, use the first sentence as title
    const sentences = recipe.split('.');
    return {
      title: sentences[0].trim(),
      description: sentences.slice(1).join('.').trim()
    };
  });
  
  return {
    ingredient: ingredient,
    recipes: formattedRecipes.slice(0, 2) // Ensure we return at most 2 recipes
  };
}

module.exports = router;