const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const fetch = require('node-fetch');
require('dotenv').config();
/**
 * Get logistics information for a specific batch
 * @route GET /api/logistics/batch/:batchId
 * @param {string} batchId - The ID of the batch
 * @returns {Object} Logistics information including shipment logs, timestamps, and regions
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batch = await Batch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    // Extract shipment logs from blocks
    const shipmentLogs = batch.blocks
      .filter(block => block.data && (block.data.type === 'shipment' || block.data.action === 'transport'))
      .map(block => ({
        blockId: block.blockId,
        actor: block.actor,
        location: block.location,
        timestamp: new Date(block.timestamp).toISOString(),
        details: block.data
      }));
    
    // Extract all timestamps from blocks
    const timestamps = batch.blocks.map(block => ({
      blockId: block.blockId,
      timestamp: new Date(block.timestamp).toISOString(),
      action: block.data?.action || 'unknown'
    }));
    
    // Extract region/location data
    const regions = {
      origin: batch.location,
      currentLocation: batch.blocks.length > 0 ? 
        batch.blocks[batch.blocks.length - 1].location : 
        batch.location,
      path: [...new Set(batch.blocks.map(block => block.location))]
    };
    
    return res.status(200).json({
      batchId: batch._id,
      productType: batch.productType,
      shipmentLogs,
      timestamps,
      regions
    });
    
  } catch (error) {
    console.error('Error fetching batch logistics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get AI-powered supply chain insights for a specific batch
 * @route GET /api/logistics/batch/:batchId/insights
 * @param {string} batchId - The ID of the batch
 * @returns {Object} AI analysis of logistics patterns and predictions
 */
router.get('/batch/:batchId/insights', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Use the existing function to get logistics data
    const logisticsData = await getBatchLogistics(batchId);
    
    if (!logisticsData) {
      return res.status(404).json({ message: 'Batch data not found' });
    }
    
    // Check if we should use a real AI service or generate insights locally
    if (process.env.USE_AI_SERVICE && process.env.HUGGINGFACE_API_KEY) {
      // Similar to recipes.js, use Hugging Face API for insights
      const insights = await getAIInsights(logisticsData);
      return res.status(200).json(insights);
    } else {
      // Generate insights locally based on the logistics data
      const insights = generateSupplyChainInsights(logisticsData);
      return res.status(200).json(insights);
    }
    
  } catch (error) {
    console.error('Error generating logistics insights:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Generate supply chain insights based on logistics data
 * @param {Object} data - The logistics data
 * @returns {Object} The structured insights
 */
function generateSupplyChainInsights(data) {
  // Extract key information from the logistics data
  const { shipmentLogs, timestamps, regions } = data;
  
  // Calculate time spent in each region
  const regionTimes = {};
  let previousLog = null;
  
  // Process path to identify regions and time spent
  regions.path.forEach(region => {
    regionTimes[region] = regionTimes[region] || 0;
  });
  
  // Calculate time between events for each region
  for (let i = 1; i < shipmentLogs.length; i++) {
    const currentLog = shipmentLogs[i];
    const prevLog = shipmentLogs[i-1];
    
    if (prevLog.location === currentLog.location) {
      const timeDiff = new Date(currentLog.timestamp) - new Date(prevLog.timestamp);
      regionTimes[currentLog.location] += timeDiff;
    }
  }
  
  // Find the region with the shortest processing time (most efficient)
  let fastestRegion = Object.keys(regionTimes)[0];
  Object.keys(regionTimes).forEach(region => {
    if (regionTimes[region] < regionTimes[fastestRegion]) {
      fastestRegion = region;
    }
  });
  
  // Find the most frequent region in the path
  const regionFrequency = {};
  regions.path.forEach(region => {
    regionFrequency[region] = (regionFrequency[region] || 0) + 1;
  });
  
  let mostActiveRegion = Object.keys(regionFrequency)[0];
  Object.keys(regionFrequency).forEach(region => {
    if (regionFrequency[region] > regionFrequency[mostActiveRegion]) {
      mostActiveRegion = region;
    }
  });
  
  // Generate the predicted best region for next quarter
  // This uses a simple heuristic based on efficiency and activity level
  const predictedRegion = fastestRegion === mostActiveRegion ? 
    fastestRegion : 
    (regionTimes[fastestRegion] < regionTimes[mostActiveRegion] / 2 ? fastestRegion : mostActiveRegion);
  
  // Calculate overall transport efficiency
  const totalJourneyTime = shipmentLogs.length > 1 ?
    (new Date(shipmentLogs[shipmentLogs.length-1].timestamp) - new Date(shipmentLogs[0].timestamp)) / (1000 * 60 * 60 * 24) :
    0;
  
  const totalDistance = regions.path.length;
  const efficiency = totalDistance > 0 ? totalJourneyTime / totalDistance : 0;
  
  // Generate insights
  return {
    insights: `This ${data.productType} batch traveled through ${regions.path.length} regions over approximately ${Math.round(totalJourneyTime)} days, with ${mostActiveRegion} showing the highest activity and ${fastestRegion} demonstrating the best processing efficiency.`,
    
    trend_analysis: `The movement pattern shows ${efficiency < 2 ? 'efficient' : 'inefficient'} transport with an average of ${efficiency.toFixed(1)} days per region transfer. ${regions.path.length > 3 ? 'Multiple handling points suggest a complex supply chain that could benefit from optimization.' : 'The relatively direct path suggests good supply chain optimization.'}`,
    
    region_prediction: {
      top_region_next_quarter: predictedRegion,
      reason: `${predictedRegion} ${predictedRegion === fastestRegion ? 'demonstrated superior processing times' : 'showed the highest throughput'} while maintaining quality standards. Historical data suggests this region's infrastructure and processes are optimally aligned with this product type.`
    },
    
    strategic_recommendation: `${predictedRegion === regions.currentLocation ? 'Maintain' : 'Shift'} primary distribution through ${predictedRegion} and ${fastestRegion === predictedRegion ? `consider reducing reliance on slower regions like ${Object.keys(regionTimes).find(r => regionTimes[r] === Math.max(...Object.values(regionTimes)))}` : `develop capabilities in ${fastestRegion} to improve overall efficiency`}.`
  };
}

/**
 * Get AI-generated insights using external AI service
 * @param {Object} logisticsData - The logistics data to analyze
 * @returns {Object} AI-generated insights
 */
async function getAIInsights(logisticsData) {
  try {
    const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
    
    const prompt = `
    You are a supply chain and market intelligence expert with a strong background in logistics analytics, predictive modeling, and regional economic forecasting.
    
    Analyze the following product journey data across multiple geographic regions and time periods:
    
    Product Type: ${logisticsData.productType}
    Regions in Path: ${JSON.stringify(logisticsData.regions.path)}
    Origin: ${logisticsData.regions.origin}
    Current Location: ${logisticsData.regions.currentLocation}
    Shipment Logs: ${JSON.stringify(logisticsData.shipmentLogs)}
    
    Your task is to:
    1. Analyze the movement and activity pattern of the product.
    2. Identify key trends, bottlenecks, or strategic pivots in regional logistics.
    3. Evaluate which regions showed the most favorable conditions (e.g., efficiency, low delay, high turnover).
    4. Use that information to predict which region is likely to be optimal for product performance in the upcoming quarter.
    5. Provide your answer in the form of a structured report with reasoning.
    
    Response MUST be in valid JSON format with these keys: insights, trend_analysis, region_prediction (with nested top_region_next_quarter and reason), and strategic_recommendation.
    `;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API error: ${response.status}`, errorText);
      // Fall back to the local generation if API fails
      return generateSupplyChainInsights(logisticsData);
    }
    
    const data = await response.json();
    
    // Parse the AI response, which should be JSON
    try {
      let jsonResponse;
      
      // The API might return different formats, try to handle common ones
      if (data[0] && data[0].generated_text) {
        // Try to extract JSON from the text
        const jsonMatch = data[0].generated_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        }
      } else if (typeof data === 'object') {
        // Maybe the response is already JSON
        jsonResponse = data;
      }
      
      if (jsonResponse && jsonResponse.insights) {
        return jsonResponse;
      } else {
        // If we can't parse the AI response, fall back to local generation
        console.warn("AI response couldn't be parsed as expected JSON, using fallback");
        return generateSupplyChainInsights(logisticsData);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return generateSupplyChainInsights(logisticsData);
    }
  } catch (error) {
    console.error("Error calling AI service:", error);
    return generateSupplyChainInsights(logisticsData);
  }
}

/**
 * Get consolidated supply chain insights across all batches
 * @route GET /api/logistics/insights/summary
 * @returns {Object} Consolidated logistics insights across all batches
 */
router.get('/insights/summary', async (req, res) => {
  try {
    // Fetch all batches from the database
    const batches = await Batch.find({});
    
    if (!batches || batches.length === 0) {
      return res.status(404).json({ message: 'No batches found in the system' });
    }
    
    // Process logistics data for each batch
    const batchesData = await Promise.all(
      batches.map(async (batch) => {
        try {
          // Extract logistics data similar to getBatchLogistics but directly from the batch
          const shipmentLogs = batch.blocks
            .filter(block => block.data && (block.data.type === 'shipment' || block.data.action === 'transport'))
            .map(block => ({
              blockId: block.blockId,
              actor: block.actor,
              location: block.location,
              timestamp: new Date(block.timestamp).toISOString(),
              details: block.data
            }));
          
          const timestamps = batch.blocks.map(block => ({
            blockId: block.blockId,
            timestamp: new Date(block.timestamp).toISOString(),
            action: block.data?.action || 'unknown'
          }));
          
          const regions = {
            origin: batch.location,
            currentLocation: batch.blocks.length > 0 ? 
              batch.blocks[batch.blocks.length - 1].location : 
              batch.location,
            path: [...new Set(batch.blocks.map(block => block.location))]
          };
          
          return {
            batchId: batch._id,
            productType: batch.productType,
            shipmentLogs,
            timestamps,
            regions
          };
        } catch (error) {
          console.error(`Error processing batch ${batch._id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null values from batches that failed to process
    const validBatchesData = batchesData.filter(batch => batch !== null);
    
    if (validBatchesData.length === 0) {
      return res.status(404).json({ message: 'Could not process any batch data' });
    }
    
    // Generate consolidated insights
    const insights = await generateConsolidatedInsights(validBatchesData);
    return res.status(200).json(insights);
    
  } catch (error) {
    console.error('Error generating consolidated insights:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Generate consolidated insights across multiple batches
 * @param {Array} batchesData - Array of logistics data for multiple batches
 * @returns {Object} Consolidated insights
 */
async function generateConsolidatedInsights(batchesData) {
  // Track metrics across all batches
  const allRegions = new Set();
  const regionMetrics = {};
  const productTypeMetrics = {};
  
  // Process each batch to gather aggregate metrics
  batchesData.forEach(batch => {
    const { shipmentLogs, regions, productType } = batch;
    
    // Track product types
    productTypeMetrics[productType] = productTypeMetrics[productType] || {
      count: 0,
      regions: new Set(),
      averageTransitTime: 0,
      totalTransitTime: 0
    };
    productTypeMetrics[productType].count++;
    
    // Add regions to the set of all regions
    regions.path.forEach(region => {
      allRegions.add(region);
      productTypeMetrics[productType].regions.add(region);
      
      // Initialize region metrics if needed
      regionMetrics[region] = regionMetrics[region] || {
        batchCount: 0,
        shipmentCount: 0,
        productTypes: new Set(),
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        isOrigin: 0,
        isFinal: 0
      };
      
      // Count batches per region
      regionMetrics[region].batchCount++;
      regionMetrics[region].productTypes.add(productType);
      
      // Check if this region is an origin or final destination
      if (regions.origin === region) {
        regionMetrics[region].isOrigin++;
      }
      if (regions.currentLocation === region) {
        regionMetrics[region].isFinal++;
      }
    });
    
    // Calculate transit time for this batch if it has shipment logs
    if (shipmentLogs.length > 1) {
      const firstLog = shipmentLogs[0];
      const lastLog = shipmentLogs[shipmentLogs.length - 1];
      const transitTime = (new Date(lastLog.timestamp) - new Date(firstLog.timestamp)) / (1000 * 60 * 60 * 24); // days
      
      productTypeMetrics[productType].totalTransitTime += transitTime;
      
      // Count shipments by region and calculate processing time
      shipmentLogs.forEach(log => {
        regionMetrics[log.location].shipmentCount++;
      });
    }
  });
  
  // Calculate averages and finalize metrics
  Object.keys(productTypeMetrics).forEach(prodType => {
    const metrics = productTypeMetrics[prodType];
    metrics.averageTransitTime = metrics.totalTransitTime / metrics.count;
    metrics.regions = Array.from(metrics.regions); // Convert Set to Array
  });
  
  // Find best performing regions based on batch throughput and position in supply chain
  const regionPerformance = Object.entries(regionMetrics).map(([name, metrics]) => {
    return {
      region: name,
      score: (metrics.batchCount * 0.4) + (metrics.shipmentCount * 0.3) + 
             ((metrics.isOrigin / batchesData.length) * 0.15) + 
             ((metrics.isFinal / batchesData.length) * 0.15),
      metrics: {
        ...metrics,
        productTypes: Array.from(metrics.productTypes)
      }
    };
  }).sort((a, b) => b.score - a.score);
  
  // Get top performing regions and product types
  const topRegions = regionPerformance.slice(0, 3).map(r => r.region);
  const productTypes = Object.keys(productTypeMetrics);
  const topProductType = productTypes.sort((a, b) => 
    productTypeMetrics[b].count - productTypeMetrics[a].count
  )[0];

  // Get the most connected region (appears in the most paths)
  const mostConnectedRegion = Object.entries(regionMetrics)
    .sort((a, b) => b[1].batchCount - a[1].batchCount)[0][0];
  
  // Use AI if enabled, otherwise generate insights locally
  if (process.env.USE_AI_SERVICE && process.env.HUGGINGFACE_API_KEY) {
    try {
      return await getAIConsolidatedInsights(batchesData, {
        regionMetrics,
        productTypeMetrics,
        topRegions,
        mostConnectedRegion
      });
    } catch (error) {
      console.error("Error with AI insights generation:", error);
      // Fall back to local generation
    }
  }
  
  // Generate insights locally
  return {
    summary: {
      total_batches: batchesData.length,
      unique_regions: allRegions.size,
      product_types: productTypes.length,
      most_common_product: topProductType
    },
    
    insights: `Across ${batchesData.length} batches, products moved through ${allRegions.size} unique regions. ${topRegions[0]} handles the highest volume, processing ${regionMetrics[topRegions[0]].batchCount} batches. ${mostConnectedRegion} serves as the primary hub in your supply chain network.`,
    
    trend_analysis: `${topProductType} is your most frequently shipped product type (${productTypeMetrics[topProductType].count} batches), with an average transit time of ${productTypeMetrics[topProductType].averageTransitTime.toFixed(1)} days. Regions ${topRegions.join(", ")} form the backbone of your supply chain with the highest throughput.`,
    
    region_prediction: {
      top_region_next_quarter: topRegions[0],
      reason: `${topRegions[0]} demonstrates superior performance metrics with high throughput (${regionMetrics[topRegions[0]].batchCount} batches) and diverse product handling capability (${regionMetrics[topRegions[0]].productTypes.length} product types).`
    },
    
    strategic_recommendation: `Consolidate operations in ${topRegions[0]} and ${topRegions[1]} to optimize throughput. Consider ${regionMetrics[topRegions[0]].isOrigin > 0 ? 'expanding' : 'establishing'} origin facilities in ${topRegions[0]} to reduce transit times and improve supply chain efficiency.`,
    
    region_performance: regionPerformance.slice(0, 5).map(r => ({
      name: r.region,
      score: Math.round(r.score * 100) / 100,
      batches_processed: r.metrics.batchCount
    }))
  };
}

/**
 * Get AI-generated consolidated insights across all batches
 * @param {Array} batchesData - Array of logistics data for all batches
 * @param {Object} metrics - Pre-calculated metrics to aid the AI
 * @returns {Object} AI-generated consolidated insights
 */
async function getAIConsolidatedInsights(batchesData, metrics) {
  try {
    const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
    
    // Prepare summary data to send to AI
    const summaryData = {
      batch_count: batchesData.length,
      unique_regions: Object.keys(metrics.regionMetrics).length,
      top_regions: metrics.topRegions.slice(0, 3),
      most_connected_region: metrics.mostConnectedRegion,
      product_types: Object.keys(metrics.productTypeMetrics).map(type => ({
        name: type,
        count: metrics.productTypeMetrics[type].count,
        avg_transit_time: metrics.productTypeMetrics[type].averageTransitTime
      }))
    };
    
    const prompt = `
    You are a supply chain and market intelligence expert with a strong background in logistics analytics, predictive modeling, and regional economic forecasting.
    
    Analyze the following aggregate supply chain data across multiple batches and regions:
    
    ${JSON.stringify(summaryData, null, 2)}
    
    Your task is to:
    1. Analyze the movement patterns and supply chain structure.
    2. Identify key trends and strategic optimization opportunities.
    3. Evaluate which regions showed the most favorable conditions.
    4. Predict which region is likely to be optimal for overall supply chain performance in the upcoming quarter.
    5. Provide your answer in the form of a structured report with reasoning.
    
    Response MUST be in valid JSON format with these keys: insights, trend_analysis, region_prediction (with nested top_region_next_quarter and reason), and strategic_recommendation.
    `;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Try to extract JSON from the AI response
    try {
      let jsonResponse;
      
      if (data[0] && data[0].generated_text) {
        const jsonMatch = data[0].generated_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        }
      } else if (typeof data === 'object') {
        jsonResponse = data;
      }
      
      if (jsonResponse && jsonResponse.insights) {
        return {
          ...jsonResponse,
          summary: {
            total_batches: batchesData.length,
            unique_regions: Object.keys(metrics.regionMetrics).length,
            product_types: Object.keys(metrics.productTypeMetrics).length
          },
          region_performance: metrics.topRegions.slice(0, 5).map(region => ({
            name: region,
            batches_processed: metrics.regionMetrics[region].batchCount,
            product_diversity: metrics.regionMetrics[region].productTypes.length
          }))
        };
      } else {
        throw new Error("AI response couldn't be parsed");
      }
    } catch (parseError) {
      throw new Error(`Error parsing AI response: ${parseError.message}`);
    }
  } catch (error) {
    throw new Error(`Error with AI service: ${error.message}`);
  }
}

module.exports = router;
