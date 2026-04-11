const Model = require('../models/Model');
const Subseries = require('../models/Subseries');

class AnalyticsService {
  static async getCollectionIntelligence() {
    // 1. Total Models
    const totalModels = await Model.countDocuments();

    // 2. Main Series Breakdown
    const models = await Model.find()
      .populate('metadata.series')
      .populate('metadata.subseries')
      .lean();

    const seriesCounts = {};
    const subseriesCounts = {};

    for (const m of models) {
      const sName = m.metadata.series ? m.metadata.series.name : "Unknown";
      seriesCounts[sName] = (seriesCounts[sName] || 0) + 1;

      const subName = m.metadata.subseries ? m.metadata.subseries.name : "Unknown";
      subseriesCounts[subName] = (subseriesCounts[subName] || 0) + 1;
    }

    // 3. Collection Goals
    const targetMilestone = totalModels < 500 ? 500 : 1000;
    const progressPercentage = targetMilestone > 0 ? (totalModels / targetMilestone) * 100 : 0;

    const collectionGoals = {
      target: targetMilestone,
      current: totalModels,
      progress_percentage: progressPercentage
    };

    // 4. Collection Insights
    const sortedSubseries = Object.entries(subseriesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topSubseries = Object.fromEntries(sortedSubseries);

    const totalSubseriesDefined = await Subseries.countDocuments();
    const uniqueSubseriesOwned = Object.keys(subseriesCounts).length;
    const diversityScore = totalSubseriesDefined > 0 ? (uniqueSubseriesOwned / totalSubseriesDefined * 100) : 0;

    const collectionInsights = {
      top_subseries: topSubseries,
      diversity_score: Number(diversityScore.toFixed(1))
    };

    // 5. Recent Additions
    const recentModels = await Model.find()
      .populate('metadata.series')
      .populate('metadata.subseries')
      .sort({ serial_number: -1 })
      .limit(10)
      .lean();

    const recentAdditions = recentModels.map(model => ({
      "S.No": model.serial_number,
      "Model Name": model.model_name,
      "Series": model.metadata.subseries ? model.metadata.subseries.name : "Unknown",
      "Main Series": model.metadata.series ? model.metadata.series.name : "Unknown",
      "Brand": model.metadata.brand || "Hot Wheels"
    }));

    return {
      total_models: totalModels,
      main_series_breakdown: seriesCounts,
      collection_goals: collectionGoals,
      collection_insights: collectionInsights,
      recent_additions: recentAdditions
    };
  }
}

module.exports = AnalyticsService;
