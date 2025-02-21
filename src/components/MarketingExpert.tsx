import React, { useState, useEffect } from 'react';
import { Crown, BookOpen, Target, BarChart2, Sparkles, AlertCircle } from 'lucide-react';
import { BrandBook, MarketingStrategy, getBrandBook, createBrandBook, getMarketingPerformance, getMarketingRecommendations } from '../services/marketing';
import ReactMarkdown from 'react-markdown';

interface MarketingExpertProps {
  onRecommendationSelect?: (recommendation: string) => void;
}

export function MarketingExpert({ onRecommendationSelect }: MarketingExpertProps) {
  const [brandBook, setBrandBook] = useState<BrandBook | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'performance' | 'recommendations'>('brand');
  const [performance, setPerformance] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrandBook();
  }, []);

  const loadBrandBook = async () => {
    try {
      const data = await getBrandBook();
      setBrandBook(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading brand book:', error);
      setLoading(false);
    }
  };

  const renderBrandBook = () => {
    if (!brandBook) return null;

    return (
      <div className="space-y-8">
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-purple-800 mb-4">Brand Essence</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-purple-600">Mission</p>
              <p className="mt-1 text-gray-800">{brandBook.mission}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600">Vision</p>
              <p className="mt-1 text-gray-800">{brandBook.vision}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">Brand Voice</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-600">Personality</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {brandBook.tone_of_voice.personality.map((trait, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Style Guide</p>
              <p className="mt-1 text-gray-800">{brandBook.tone_of_voice.style_guide}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-yellow-800 mb-4">Visual Identity</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-yellow-600">Color Palette</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {brandBook.visual_identity.color_palette.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm text-gray-700">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">Typography</p>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-700">
                  Primary: {brandBook.visual_identity.typography.primary_font}
                </p>
                <p className="text-sm text-gray-700">
                  Secondary: {brandBook.visual_identity.typography.secondary_font}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-green-800 mb-4">Target Audience</h3>
          <div className="grid gap-6">
            {brandBook.target_audience.map((audience, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-medium text-green-700">{audience.persona}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-600">Demographics</p>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(audience.demographics).map(([key, value]) => (
                        <li key={key} className="text-sm text-gray-700">
                          {key}: {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Psychographics</p>
                    <ul className="mt-1 space-y-1">
                      {audience.psychographics.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (!performance) return null;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-purple-600">Total Reach</h4>
            <p className="mt-2 text-3xl font-semibold text-purple-800">
              {performance.total_reach.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-blue-600">Engagement Rate</h4>
            <p className="mt-2 text-3xl font-semibold text-blue-800">
              {(performance.total_engagement * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-green-600">Conversions</h4>
            <p className="mt-2 text-3xl font-semibold text-green-800">
              {performance.total_conversions.toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-600">Revenue</h4>
            <p className="mt-2 text-3xl font-semibold text-yellow-800">
              ${performance.total_revenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Channel Performance</h3>
            <div className="space-y-4">
              {Object.entries(performance.channel_performance).map(([channel, metrics]: [string, any]) => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{channel}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {metrics.reach.toLocaleString()} views
                    </span>
                    <span className="text-sm text-gray-500">
                      {(metrics.engagement * 100).toFixed(1)}% engagement
                    </span>
                    <span className="text-sm text-green-600">
                      ${metrics.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              {performance.campaign_performance.map((campaign: any) => (
                <div key={campaign.name} className="space-y-2">
                  <h4 className="font-medium text-gray-700">{campaign.name}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {campaign.metrics.reach.toLocaleString()} views
                    </span>
                    <span className="text-sm text-gray-500">
                      {(campaign.metrics.engagement * 100).toFixed(1)}% engagement
                    </span>
                    <span className="text-sm text-green-600">
                      ${campaign.metrics.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations) return null;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Strategy Recommendations</h3>
            <ul className="space-y-3">
              {recommendations.strategy.map((rec: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors"
                  onClick={() => onRecommendationSelect?.(rec)}
                >
                  <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Channel Recommendations</h3>
            <ul className="space-y-3">
              {recommendations.channels.map((rec: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-2 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                  onClick={() => onRecommendationSelect?.(rec)}
                >
                  <BarChart2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Content Recommendations</h3>
            <ul className="space-y-3">
              {recommendations.content.map((rec: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
                  onClick={() => onRecommendationSelect?.(rec)}
                >
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">Budget Recommendations</h3>
            <ul className="space-y-3">
              {recommendations.budget.map((rec: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-2 cursor-pointer hover:bg-yellow-100 p-2 rounded transition-colors"
                  onClick={() => onRecommendationSelect?.(rec)}
                >
                  <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xl">
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('brand')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'brand'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Brand Book
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Recommendations
          </button>
        </nav>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : (
          <>
            {activeTab === 'brand' && renderBrandBook()}
            {activeTab === 'performance' && renderPerformance()}
            {activeTab === 'recommendations' && renderRecommendations()}
          </>
        )}
      </div>
    </div>
  );
}